import Grid from '../components/Grid.js';

export default class BuildingManager {
    constructor(scene) {
        this.scene = scene;
        this.selectedBuilding = null;
        this.previewBuilding = null;
        this.setupInputHandlers();
    }

    setupInputHandlers() {
        this.scene.input.on('pointerdown', this.handleClick.bind(this));
        this.scene.input.on('pointermove', this.updatePreview.bind(this));
    }

    handleClick(pointer) {
        if (!this.selectedBuilding || pointer.rightButtonDown()) return;

        try {
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const hoveredTile = this.scene.grid.grid.flat().find(tile => {
                const bounds = new Phaser.Geom.Rectangle(
                    tile.x - tile.displayWidth / 2,
                    tile.y - tile.displayHeight / 2,
                    tile.displayHeight,
                    tile.displayHeight
                );
                return bounds.contains(worldPoint.x, worldPoint.y);
            });

            if (hoveredTile && hoveredTile.data) {
                const gridPosition = hoveredTile.data;
                const key = `${gridPosition.gridX},${gridPosition.gridY}`;

                if (this.scene.grid.buildingGrid[key]) {
                    this.scene.showFeedback('Posição já ocupada', false);
                    return;
                }

                if (!this.scene.grid.isValidPosition(gridPosition.gridX, gridPosition.gridY)) {
                    this.scene.showFeedback('Posição inválida', false);
                    return;
                }

                const {tileX, tileY} = this.scene.grid.gridToIso(gridPosition.gridX, gridPosition.gridY);
                const worldX = this.scene.cameras.main.centerX + tileX;
                const worldY = this.scene.cameras.main.centerY + tileY;

                this.placeBuilding(gridPosition.gridX, gridPosition.gridY, worldX, worldY);
            }
        } catch (error) {
            console.error('Error placing building:', error);
            this.scene.showFeedback('Erro ao posicionar estrutura', false);
        }
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

        // Create NPC for house buildings
        if (['farmerHouse', 'minerHouse', 'fishermanHouse', 'lumberHouse'].includes(this.selectedBuilding)) {
            this.scene.createFarmerNPC(gridX, gridY, worldX, worldY);
        }

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

    updatePreview(pointer) {
        if (!this.selectedBuilding) {
            if (this.previewBuilding) {
                this.previewBuilding.destroy();
                this.previewBuilding = null;
            }
            return;
        }

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

    clearBuildingSelection() {
        this.selectedBuilding = null;
        if (this.previewBuilding) {
            this.previewBuilding.destroy();
            this.previewBuilding = null;
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
        this.scene.showFeedback('Estrutura construída!', true);
    }
}