
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
}
