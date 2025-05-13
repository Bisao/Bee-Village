
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
