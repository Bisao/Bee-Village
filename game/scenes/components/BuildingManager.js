
export default class BuildingManager {
    constructor(scene) {
        this.scene = scene;
        this.selectedBuilding = null;
        this.previewBuilding = null;
        this.setupInputHandlers();
    }

    setupInputHandlers() {
        this.scene.input.on('pointerdown', this.handleClick, this);
        this.scene.input.on('pointermove', this.updatePreview, this);
    }

    handleClick(pointer) {
        if (pointer.rightButtonDown()) return;
        
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const { gridX, gridY } = this.scene.grid.worldToGrid(worldPoint.x, worldPoint.y);
        
        if (this.selectedBuilding) {
            this.placeBuilding(gridX, gridY, worldPoint.x, worldPoint.y);
        }
    }

    updatePreview(pointer) {
        if (!this.selectedBuilding || !this.previewBuilding) return;

        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const { gridX, gridY } = this.scene.grid.worldToGrid(worldPoint.x, worldPoint.y);
        
        if (this.isValidGridPosition(gridX, gridY)) {
            this.previewBuilding.setPosition(worldPoint.x, worldPoint.y);
            this.previewBuilding.setAlpha(0.5);
        } else {
            this.previewBuilding.setAlpha(0.2);
        }
    }

    isValidGridPosition(gridX, gridY) {
        return gridX >= 0 && gridY >= 0 && 
               gridX < this.scene.grid.width && 
               gridY < this.scene.grid.height;
    }

    placeBuilding(gridX, gridY, worldX, worldY) {
        if (!this.validateBuildingPlacement(gridX, gridY)) {
            return false;
        }

        const building = this.createBuilding(gridX, gridY);
        if (!building) {
            return false;
        }

        this.registerBuildingEvents(building);
        this.updateGridState(gridX, gridY, building);
        this.scene.feedbackManager.provideVisualFeedback(gridX, gridY);

        // Validate if it's a house that can have NPC
        const npcHouses = ['farmerHouse', 'minerHouse', 'fishermanHouse', 'lumberHouse'];
        const isNPCHouse = npcHouses.includes(this.selectedBuilding);

        // Create NPC for each house if it's a valid house type
        if (isNPCHouse) {
            this.scene.npcManager.createNPC(gridX, gridY, worldX, worldY);
        }

        // Add click handler for silo
        if (this.selectedBuilding === 'silo') {
            building.setInteractive({ useHandCursor: true });
            building.on('pointerdown', (pointer) => {
                if (!pointer.rightButtonDown()) {
                    this.scene.uiManager.showPanel('silo', [
                        { name: 'Sementes', icon: '🌾', amount: 0 },
                        { name: 'Trigo', icon: '🌾', amount: 0 },
                        { name: 'Cenoura', icon: '🥕', amount: 0 },
                        { name: 'Milho', icon: '🌽', amount: 0 },
                        { name: 'Madeira', icon: '🪵', amount: 0 },
                        { name: 'Peixe', icon: '🐟', amount: 0 },
                        { name: 'Minério', icon: '⛏️', amount: 0 }
                    ]);
                }
            });
        }

        return true;
    }

    validateBuildingPlacement(gridX, gridY) {
        return this.scene.grid.isValidPosition(gridX, gridY) && 
               !this.scene.grid.isOccupied(gridX, gridY);
    }

    createBuilding(gridX, gridY) {
        try {
            const building = this.scene.add.sprite(
                gridX * this.scene.grid.tileWidth,
                gridY * this.scene.grid.tileHeight,
                this.selectedBuilding
            );
            building.setDepth(1);
            return building;
        } catch (error) {
            console.error('Failed to create building:', error);
            return null;
        }
    }

    registerBuildingEvents(building) {
        // Add events here if needed
    }

    updateGridState(gridX, gridY, building) {
        const key = `${gridX},${gridY}`;
        this.scene.grid.buildingGrid[key] = {
            sprite: building,
            type: 'building',
            buildingType: this.selectedBuilding,
            gridX: gridX,
            gridY: gridY
        };
    }

    clearBuildingSelection() {
        this.selectedBuilding = null;
        if (this.previewBuilding) {
            this.previewBuilding.destroy();
            this.previewBuilding = null;
        }
    }

    cancelBuildingSelection() {
        this.clearBuildingSelection();
        this.scene.showFeedback('Seleção cancelada', true);
    }

    placeBuilding(gridX, gridY, worldX, worldY) {
        if (!this.validateBuildingPlacement(gridX, gridY)) {
            return false;
        }

        const building = this.createBuilding(gridX, gridY, worldX, worldY);
        if (!building) return false;

        this.registerBuildingInGrid(gridX, gridY, building);
        this.setupBuildingInteractions(building, gridX, gridY);
        this.showPlacementFeedback(worldX, worldY);

        return true;
    }

    validateBuildingPlacement(gridX, gridY) {
        if (!this.selectedBuilding) {
            console.log('No building selected');
            return false;
        }

        if (!this.scene.grid.isValidPosition(gridX, gridY)) {
            this.scene.showFeedback('Posição inválida', false);
            return false;
        }

        const key = `${gridX},${gridY}`;
        if (this.scene.grid.buildingGrid[key]) {
            this.scene.showFeedback('Posição já ocupada', false);
            return false;
        }

        return true;
    }

    createBuilding(gridX, gridY, worldX, worldY) {
        const building = this.scene.add.sprite(worldX, worldY, this.selectedBuilding);
        const scale = (this.scene.grid.tileWidth * 1.4) / building.width;
        
        building.setScale(scale);
        building.setOrigin(0.5, 0.75);
        building.setDepth(gridY + 1);

        return building;
    }

    registerBuildingInGrid(gridX, gridY, building) {
        const key = `${gridX},${gridY}`;
        this.scene.grid.buildingGrid[key] = {
            sprite: building,
            type: 'building',
            buildingType: this.selectedBuilding,
            gridX: gridX,
            gridY: gridY
        };
    }

    setupBuildingInteractions(building, gridX, gridY) {
        if (this.selectedBuilding === 'silo') {
            building.setInteractive({ useHandCursor: true });
            this.scene.resourceSystem.registerSilo(gridX, gridY, building);
        }
    }

    showPlacementFeedback(worldX, worldY) {
        const particles = this.scene.add.particles(0, 0, 'tile_grass', {
            x: worldX,
            y: worldY,
            speed: 150,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            quantity: 6,
            emitting: false
        });

        particles.start();
        this.scene.time.delayedCall(500, () => particles.destroy());
    }
}
