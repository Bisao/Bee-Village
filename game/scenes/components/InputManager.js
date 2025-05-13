export default class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.isDragging = false;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        this.setupInputHandlers();
        this.setupKeyboardControls();
        if (this.isMobile) {
            this.setupTouchHandlers();
        }
    }

    handleKeyDown(event) {
        if (this.scene.farmer.isMoving) return;

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

    setupInputHandlers() {
        this.scene.game.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.scene.input.on('pointerdown', this.handlePointerDown, this);
        this.scene.input.on('pointermove', this.handlePointerMove, this);
        this.scene.input.on('pointerup', this.handlePointerUp, this);

        if (!this.isMobile) {
            this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                const zoom = this.scene.cameras.main.zoom;
                const newZoom = zoom - (deltaY * (window.innerWidth < 768 ? 0.0005 : 0.001));
                this.scene.cameras.main.setZoom(
                    Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                );
            });
        }
    }

    setupPinchZoom() {
        this.scene.input.addPointer(1);
        
        if (this.isMobile) {
            let prevDist = 0;
            
            this.scene.input.on('pointermove', (pointer) => {
                if (this.scene.input.pointer1.isDown && this.scene.input.pointer2.isDown) {
                    const dist = Phaser.Math.Distance.Between(
                        this.scene.input.pointer1.x,
                        this.scene.input.pointer1.y,
                        this.scene.input.pointer2.x,
                        this.scene.input.pointer2.y
                    );
                    
                    if (prevDist) {
                        const diff = prevDist - dist;
                        const zoom = this.scene.cameras.main.zoom;
                        const newZoom = zoom - (diff * 0.0005);
                        this.scene.cameras.main.setZoom(
                            Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                        );
                    }
                    
                    prevDist = dist;
                }
            });
        }
    }

    handlePointerDown(pointer) {
        if (pointer.rightButtonDown()) {
            this.isDragging = true;
            this.scene.game.canvas.style.cursor = 'grabbing';
        }
    }

    handlePointerMove(pointer) {
        if (this.isDragging) {
            this.scene.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.scene.cameras.main.zoom;
            this.scene.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.scene.cameras.main.zoom;
        }
    }

    handlePointerUp() {
        this.isDragging = false;
        this.scene.game.canvas.style.cursor = 'default';
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

    setupTouchHandlers() {
        this.setupPinchZoom();
    }
}