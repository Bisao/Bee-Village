export default class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.isDragging = false;
    }

    init() {
        this.setupKeyboardControls();
        this.setupUIHandlers();
        this.setupPointerListeners();
    }

    handleKeyDown(event) {
        if (this.scene.farmer?.isMoving) return;

        let direction = null;
        let animKey = null;

        switch(event.key.toLowerCase()) {
            case 'w':
                direction = { x: 0, y: -1 };
                animKey = 'farmer_up';
                break;
            case 's':
                direction = { x: 0, y: 1 };
                animKey = 'farmer_down';
                break;
            case 'a':
                direction = { x: -1, y: 0 };
                animKey = 'farmer_left';
                break;
            case 'd':
                direction = { x: 1, y: 0 };
                animKey = 'farmer_right';
                break;
        }

        if (direction) {
            const newX = this.scene.farmer.gridX + direction.x;
            const newY = this.scene.farmer.gridY + direction.y;

            if (this.scene.grid.isValidPosition(newX, newY) && !this.scene.isTileOccupied(newX, newY)) {
                this.scene.movementManager.moveFarmer(direction, animKey);
            }
        }
    }

    handleClick(pointer) {
        if (this.scene.selectedBuilding) {
            const gridX = Math.floor((pointer.worldX - this.scene.cameras.main.centerX) / this.scene.grid.tileWidth);
            const gridY = Math.floor((pointer.worldY - this.scene.cameras.main.centerY) / this.scene.grid.tileHeight);

            if (this.scene.gridManager.isValidGridPosition(gridX, gridY) && !this.scene.gridManager.isTileOccupied(gridX, gridY)) {
                const {tileX, tileY} = this.scene.grid.gridToIso(gridX, gridY);
                const worldX = this.scene.cameras.main.centerX + tileX;
                const worldY = this.scene.cameras.main.centerY + tileY;

                this.scene.buildingManager.placeBuilding(gridX, gridY, worldX, worldY, this.scene.selectedBuilding);
                this.scene.buildingManager.cancelBuildingSelection();
            } else {
                console.log("Invalid position for building.");
                this.scene.feedbackManager.showFeedback("Invalid position!", false);
            }
        }
    }

    updatePreview(pointer) {
        if (this.scene.selectedBuilding) {
            const gridX = Math.floor((pointer.worldX - this.scene.cameras.main.centerX) / this.scene.grid.tileWidth);
            const gridY = Math.floor((pointer.worldY - this.scene.cameras.main.centerY) / this.scene.grid.tileHeight);

            if (this.scene.gridManager.isValidGridPosition(gridX, gridY)) {
                const {tileX, tileY} = this.scene.grid.gridToIso(gridX, gridY);
                const worldX = this.scene.cameras.main.centerX + tileX;
                const worldY = this.scene.cameras.main.centerY + tileY;

                if (!this.scene.previewBuilding) {
                    this.scene.previewBuilding = this.scene.add.sprite(worldX, worldY, this.scene.selectedBuilding);
                    this.scene.previewBuilding.setOrigin(0.5, 1);
                    this.scene.previewBuilding.setAlpha(0.5);
                } else {
                    this.scene.previewBuilding.x = worldX;
                    this.scene.previewBuilding.y = worldY;
                }
            } else {
                if (this.scene.previewBuilding) {
                    this.scene.previewBuilding.destroy();
                    this.scene.previewBuilding = null;
                }
            }
        }
    }

    setupPointerListeners() {
        this.scene.input.on('pointerdown', this.handleClick.bind(this));
        this.scene.input.on('pointermove', this.updatePreview.bind(this));
    }

    setupUIHandlers() {
        const buttons = document.querySelectorAll('.building-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.getAttribute('data-building');
                this.scene.buildingManager.selectBuilding(buildingType);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.scene.buildingManager.cancelBuildingSelection();
            }
        });
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
}