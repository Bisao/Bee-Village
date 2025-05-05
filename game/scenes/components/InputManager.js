
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
        // Prevent context menu on right click
        this.scene.game.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, false);
        
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
        let prevDist = 0;
        let lastZoomTime = 0;

        this.scene.input.on('pointermove', () => {
            const now = Date.now();
            if (this.scene.input.pointer1.isDown && this.scene.input.pointer2.isDown) {
                const dx = this.scene.input.pointer1.x - this.scene.input.pointer2.x;
                const dy = this.scene.input.pointer1.y - this.scene.input.pointer2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (prevDist > 0 && (now - lastZoomTime > 16)) {
                    const delta = dist - prevDist;
                    const zoom = this.scene.cameras.main.zoom;
                    const sensitivity = window.innerWidth < 768 ? 0.002 : 0.001;
                    const newZoom = zoom + (delta * sensitivity);
                    this.scene.cameras.main.setZoom(
                        Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                    );
                    lastZoomTime = now;
                }
                prevDist = dist;
            }
        });

        this.scene.input.on('pointerup', () => {
            prevDist = 0;
        });
    }

    handlePointerDown(pointer) {
        if (pointer.rightButtonDown() || this.isMobile) {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
            this.lastZoomDistance = 0;
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
