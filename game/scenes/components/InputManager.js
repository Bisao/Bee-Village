
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
            let isDragging = false;
            let lastCenterX = 0;
            let lastCenterY = 0;
            
            this.scene.input.on('pointermove', (pointer) => {
                if (this.scene.input.pointer1.isDown && this.scene.input.pointer2.isDown) {
                    const pointer1 = this.scene.input.pointer1;
                    const pointer2 = this.scene.input.pointer2;
                    
                    const centerX = (pointer1.x + pointer2.x) / 2;
                    const centerY = (pointer1.y + pointer2.y) / 2;
                    
                    const dist = Phaser.Math.Distance.Between(
                        pointer1.x, pointer1.y,
                        pointer2.x, pointer2.y
                    );
                    
                    if (prevDist) {
                        // Handle zoom
                        const diff = prevDist - dist;
                        const zoom = this.scene.cameras.main.zoom;
                        const newZoom = zoom - (diff * 0.001);
                        this.scene.cameras.main.setZoom(
                            Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                        );
                        
                        // Handle pan
                        if (isDragging) {
                            const dx = centerX - lastCenterX;
                            const dy = centerY - lastCenterY;
                            this.scene.cameras.main.scrollX -= dx / this.scene.cameras.main.zoom;
                            this.scene.cameras.main.scrollY -= dy / this.scene.cameras.main.zoom;
                        }
                    }
                    
                    prevDist = dist;
                    lastCenterX = centerX;
                    lastCenterY = centerY;
                    isDragging = true;
                } else {
                    isDragging = false;
                }
            });
            
            this.scene.input.on('pointerup', () => {
                prevDist = 0;
                isDragging = false;
            });
        }
    }

    handlePointerDown(pointer) {
        if (this.isMobile) {
            // Single finger drag on mobile
            if (this.scene.input.pointer1.isDown && !this.scene.input.pointer2.isDown) {
                this.isDragging = true;
            }
        } else if (pointer.rightButtonDown()) {
            // Right click drag on desktop
            this.isDragging = true;
            this.scene.game.canvas.style.cursor = 'grabbing';
        }
    }

    handlePointerMove(pointer) {
        if (this.isDragging && !this.scene.input.pointer2.isDown) {
            // Move grid with single finger or right click
            this.scene.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.scene.cameras.main.zoom;
            this.scene.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.scene.cameras.main.zoom;
        }
    }

    handlePointerUp() {
        this.isDragging = false;
        if (!this.isMobile) {
            this.scene.game.canvas.style.cursor = 'default';
        }
    }
}
