export default class BuildingManager {
    constructor(scene) {
        this.scene = scene;
        this.selectedBuilding = null;
        this.previewBuilding = null;
    }

    placeBuilding(gridX, gridY, worldX, worldY) {
        try {
            if (!this.validateBuildingPlacement(gridX, gridY)) {
                return false;
            }

            const building = this.createBuilding(worldX, worldY);
            if (!building) {
                return false;
            }

            this.registerBuildingInGrid(building, gridX, gridY);
            this.handleSpecialBuildings(building, gridX, gridY);
            this.showPlacementEffect(worldX, worldY);

            this.scene.feedbackManager.showFeedback('Estrutura construída!', true);
            this.clearBuildingSelection();

            return true;
        } catch (error) {
            console.error('Error placing building:', error);
            this.scene.feedbackManager.showFeedback('Erro ao construir estrutura', false);
            return false;
        }
    }

    validateBuildingPlacement(gridX, gridY) {
        if (!this.selectedBuilding) {
            console.log('No building selected');
            return false;
        }

        if (!this.scene.gridManager.isValidGridPosition(gridX, gridY)) {
            this.scene.feedbackManager.showFeedback('Posição inválida', false);
            return false;
        }

        const key = `${gridX},${gridY}`;
        if (this.scene.grid.buildingGrid[key]) {
            this.scene.feedbackManager.showFeedback('Posição já ocupada', false);
            return false;
        }

        return true;
    }

    createBuilding(worldX, worldY) {
        const building = this.scene.add.sprite(worldX, worldY, this.selectedBuilding);
        const scale = (this.scene.grid.tileWidth * 1.4) / building.width;
        building.setScale(scale);
        building.setOrigin(0.5, 0.75);
        building.setDepth(worldY + 1);
        return building;
    }

    registerBuildingInGrid(building, gridX, gridY) {
        const key = `${gridX},${gridY}`;
        this.scene.grid.buildingGrid[key] = {
            sprite: building,
            type: 'building',
            buildingType: this.selectedBuilding,
            gridX: gridX,
            gridY: gridY
        };
    }

    handleSpecialBuildings(building, gridX, gridY) {
        if (this.selectedBuilding === 'silo') {
            this.setupSiloInteraction(building, gridX, gridY);
        }

        if (['farmerHouse', 'minerHouse', 'FishermanHouse', 'lumberHouse'].includes(this.selectedBuilding)) {
            this.scene.npcManager.createNPC(gridX, gridY);
        }
    }

    setupSiloInteraction(building, gridX, gridY) {
        building.setInteractive({ useHandCursor: true });
        this.scene.resourceSystem.registerSilo(gridX, gridY, building);
        building.on('pointerdown', () => {
            const resources = this.scene.resourceSystem.getSiloResources(gridX, gridY);
            this.scene.uiManager.showSiloModal(resources);
        });
    }

    showPlacementEffect(x, y) {
        const particles = this.scene.add.particles(0, 0, 'tile_grass', {
            x: x,
            y: y,
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

    clearBuildingSelection() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(b => b.classList.remove('selected'));
        this.selectedBuilding = null;
        if (this.previewBuilding) {
            this.previewBuilding.destroy();
            this.previewBuilding = null;
        }
    }

    updatePreview(pointer) {
        if (!this.selectedBuilding) {
            if (this.previewBuilding) {
                this.previewBuilding.destroy();
                this.previewBuilding = null;
            }
            this.scene.gridManager.clearTileHighlights();
            return;
        }

        this.scene.gridManager.updateTileHighlights();

        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const hoveredTile = this.scene.grid.grid.flat().find(tile => {
            const bounds = new Phaser.Geom.Rectangle(
                tile.x - tile.displayWidth / 2,
                tile.y - tile.displayHeight / 2,
                tile.displayWidth,
                tile.displayHeight
            );
            return bounds.contains(worldPoint.x, worldPoint.y);
        });

        if (hoveredTile) {
            const gridPosition = hoveredTile.data;
            const {tileX, tileY} = this.scene.grid.gridToIso(gridPosition.gridX, gridPosition.gridY);
            const worldX = this.scene.cameras.main.centerX + tileX;
            const worldY = this.scene.cameras.main.centerY + tileY;

            if (!this.previewBuilding) {
                this.previewBuilding = this.scene.add.sprite(
                    worldX,
                    worldY,
                    this.selectedBuilding
                );
                const tileScale = 1.4;
                const scale = (this.scene.grid.tileWidth * tileScale) / this.previewBuilding.width;
                this.previewBuilding.setScale(scale);
                this.previewBuilding.setOrigin(0.5, 0.75);
                this.previewBuilding.setAlpha(0.6);
            } else {
                this.previewBuilding.setPosition(worldX, worldY);
            }
            this.previewBuilding.setDepth(gridPosition.gridY + 1);
        }
    }
}