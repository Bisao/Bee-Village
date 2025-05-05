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
        this.setupPinchZoom();
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
    }

    handlePointerDown(pointer) {
        if (this.isMobile) {
            this.touchStartTime = Date.now();
            if (!pointer.event.target.closest('#controls-panel, #side-panel, .topbar')) {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        } else if (pointer.rightButtonDown()) {
            if (this.scene.selectedBuilding) {
                this.scene.cancelBuildingSelection();
                const buttons = document.querySelectorAll('.building-btn');
                buttons.forEach(b => b.classList.remove('selected'));
            } else {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        }
    }

    handlePointerMove(pointer) {
        const twoFingersDown = this.scene.input.pointer1.isDown && this.scene.input.pointer2.isDown;
        if (this.isDragging && !twoFingersDown) {
            const deltaX = pointer.x - this.dragStartX;
            const deltaY = pointer.y - this.dragStartY;
            this.scene.cameras.main.scrollX -= deltaX;
            this.scene.cameras.main.scrollY -= deltaY;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
        }
    }

    handlePointerUp() {
        this.isDragging = false;
    }
}