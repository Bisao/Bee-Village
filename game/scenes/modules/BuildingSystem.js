export default class BuildingSystem {
    constructor(scene, grid, resourceSystem, uiManager, characterManager, gameDataManager) {
        this.scene = scene;
        this.grid = grid;
        this.resourceSystem = resourceSystem;
        this.uiManager = uiManager; // For feedback and UI updates
        this.characterManager = characterManager; // For creating NPCs when houses are built
        this.gameDataManager = gameDataManager; // For profession names/emojis

        this.selectedBuilding = null;
        this.previewBuilding = null;
    }

    setSelectedBuilding(buildingType) {
        this.selectedBuilding = buildingType;
        if (this.previewBuilding) {
            this.previewBuilding.destroy();
            this.previewBuilding = null;
        }
        // The UIManager already handles button selection class changes.
        // MainScene will call updatePreview on pointermove.
    }

    clearBuildingSelection() {
        this.selectedBuilding = null;
        if (this.previewBuilding) {
            this.previewBuilding.destroy();
            this.previewBuilding = null;
        }
        if (this.uiManager) {
            this.uiManager.clearBuildingButtonSelection(); // Ensure UI buttons are deselected
        }
        this.clearTileHighlights();
    }

    updatePreview(pointer) {
        if (!this.selectedBuilding) {
            if (this.previewBuilding) {
                this.previewBuilding.destroy();
                this.previewBuilding = null;
            }
            this.clearTileHighlights();
            return;
        }

        this.updateTileHighlights(); // Highlight valid/invalid tiles

        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        // Find hovered tile based on worldPoint. This logic was in MainScene, needs grid access.
        const hoveredTile = this.grid.getTileAtWorldXY(worldPoint.x, worldPoint.y);

        if (hoveredTile && hoveredTile.data) {
            const gridPosition = hoveredTile.data; // Assuming tile.data stores {gridX, gridY}
            const { tileX, tileY } = this.grid.gridToIso(gridPosition.gridX, gridPosition.gridY);
            const worldX = this.scene.cameras.main.centerX + tileX;
            const worldY = this.scene.cameras.main.centerY + tileY;

            if (!this.previewBuilding) {
                this.previewBuilding = this.scene.add.sprite(
                    worldX,
                    worldY,
                    this.selectedBuilding
                );
                // Scale and origin from original code
                const tileScale = 1.4;
                const scale = (this.grid.tileWidth * tileScale) / this.previewBuilding.width;
                this.previewBuilding.setScale(scale);
                this.previewBuilding.setOrigin(0.5, 0.75); 
                this.previewBuilding.setAlpha(0.6);
            } else {
                this.previewBuilding.setPosition(worldX, worldY);
            }
            this.previewBuilding.setDepth(gridPosition.gridY + 1 + 0.1); // Ensure preview is slightly above other things on same Y
            
            // Change tint based on validity
            const key = `${gridPosition.gridX},${gridPosition.gridY}`;
            if (this.grid.buildingGrid[key] || !this.grid.isValidPosition(gridPosition.gridX, gridPosition.gridY)) {
                this.previewBuilding.setTint(0xff0000); // Red for invalid
            } else {
                this.previewBuilding.clearTint(); // Green or no tint for valid (handled by tile highlight)
            }

        } else {
            if (this.previewBuilding) {
                this.previewBuilding.destroy();
                this.previewBuilding = null;
            }
        }
    }

    handlePlacementClick(pointer) {
        if (!this.selectedBuilding || pointer.rightButtonDown()) return;

        try {
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const hoveredTile = this.grid.getTileAtWorldXY(worldPoint.x, worldPoint.y);

            if (hoveredTile && hoveredTile.data) {
                const gridPosition = hoveredTile.data;
                const key = `${gridPosition.gridX},${gridPosition.gridY}`;

                if (this.grid.buildingGrid[key]) {
                    if (this.uiManager) this.uiManager.showFeedback("Position already occupied", false);
                    return;
                }

                if (!this.grid.isValidPosition(gridPosition.gridX, gridPosition.gridY)) {
                    if (this.uiManager) this.uiManager.showFeedback("Invalid position", false);
                    return;
                }

                const { tileX, tileY } = this.grid.gridToIso(gridPosition.gridX, gridPosition.gridY);
                const worldX = this.scene.cameras.main.centerX + tileX;
                const worldY = this.scene.cameras.main.centerY + tileY;

                this.placeBuilding(gridPosition.gridX, gridPosition.gridY, worldX, worldY, this.selectedBuilding);
            }
        } catch (error) {
            console.error("Error in handlePlacementClick:", error);
            if (this.uiManager) this.uiManager.showFeedback("Error placing structure", false);
        }
    }

    placeBuilding(gridX, gridY, worldX, worldY, buildingTypeToPlace) {
        try {
            if (!buildingTypeToPlace) {
                console.log("No building type specified for placement");
                return false;
            }
            // worldX, worldY are calculated based on gridX, gridY if not provided directly
            // This method can be called internally (e.g. initial placement) or by click handler

            const key = `${gridX},${gridY}`;
            if (this.grid.buildingGrid[key]) {
                if (this.uiManager) this.uiManager.showFeedback("Position already occupied", false);
                return false;
            }
            if (!this.grid.isValidPosition(gridX, gridY)) {
                if (this.uiManager) this.uiManager.showFeedback("Invalid position", false);
                return false;
            }

            const building = this.scene.add.sprite(worldX, worldY, buildingTypeToPlace);
            if (!building) {
                throw new Error(`Failed to create building sprite for type: ${buildingTypeToPlace}`);
            }

            const scale = (this.grid.tileWidth * 1.4) / building.width;
            building.setScale(scale);
            building.setOrigin(0.5, 0.75); // Consistent with preview
            building.setDepth(gridY + 1);

            this.grid.buildingGrid[key] = {
                sprite: building,
                type: "building",
                buildingType: buildingTypeToPlace,
                gridX: gridX,
                gridY: gridY
            };

            if (buildingTypeToPlace === "silo") {
                building.setInteractive({ useHandCursor: true });
                this.resourceSystem.registerSilo(gridX, gridY, building);
                building.on("pointerdown", () => {
                    if (pointer.rightButtonDown()) return; // Prevent placement conflict
                    const resources = this.resourceSystem.getSiloResources(gridX, gridY);
                    if (this.uiManager) this.uiManager.showSiloModal([
                        { name: "Wood", amount: resources.wood },
                        { name: "Wheat", amount: resources.wheat },
                        { name: "Ore", amount: resources.ore }
                    ]);
                });
            }

            const npcHouses = ["farmerHouse", "minerHouse", "FishermanHouse", "lumberHouse"];
            if (npcHouses.includes(buildingTypeToPlace) && this.characterManager) {
                this.characterManager.createFarmerNPC(gridX, gridY, worldX, worldY, buildingTypeToPlace);
            }

            this.playPlacementEffect(worldX, worldY);
            if (this.uiManager) this.uiManager.showFeedback("Structure built!", true);
            
            this.scene.events.emit("buildingPlaced", { gridX, gridY, buildingType: buildingTypeToPlace });

            // If this was a user placement, clear selection
            if (this.selectedBuilding === buildingTypeToPlace) {
                 this.clearBuildingSelection();
                 // Show panel after structure placement (original logic)
                 const sidePanel = document.getElementById("side-panel");
                 if(sidePanel) sidePanel.style.display = "flex";
            }
            return true;

        } catch (error) {
            console.error(`Error placing building ${buildingTypeToPlace}:`, error);
            if (this.uiManager) this.uiManager.showFeedback("Error building structure", false);
            return false;
        }
    }

    playPlacementEffect(worldX, worldY) {
        const particles = this.scene.add.particles(0, 0, "tile_grass", { // Assuming tile_grass is loaded
            x: worldX,
            y: worldY,
            speed: 150,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 400,
            blendMode: "ADD",
            quantity: 6,
            emitting: false
        });
        particles.setDepth(worldY + 100); // Ensure particles are on top
        particles.start();
        this.scene.time.delayedCall(500, () => particles.destroy());
    }

    isTileOccupiedByBuilding(x, y) {
        const key = `${x},${y}`;
        const object = this.grid.buildingGrid[key];
        return object && (object.type === "building" || object.type === "rock" || object.type === "tree"); // Consider env objects as occupied
    }

    clearTileHighlights() {
        this.grid.grid.flat().forEach(tile => {
            if(tile) tile.clearTint();
        });
    }

    updateTileHighlights() {
        this.grid.grid.flat().forEach(tile => {
            if (!tile || !tile.data) return;
            const gridPosition = tile.data;
            const key = `${gridPosition.gridX},${gridPosition.gridY}`;

            if (this.grid.buildingGrid[key]) {
                tile.setTint(0xFF0000); // Occupied - Red
            } else if (this.grid.isValidPosition(gridPosition.gridX, gridPosition.gridY)) {
                tile.setTint(0x00FF00); // Available - Green
            } else {
                tile.setTint(0xFF0000); // Invalid (out of bounds) - Red
            }
        });
    }
}

