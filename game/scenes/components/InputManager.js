
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
            let pinchStartZoom = 0;
            
            this.scene.input.on('pointermove', (pointer) => {
                if (this.scene.input.pointer1.isDown && this.scene.input.pointer2.isDown) {
                    const dist = Phaser.Math.Distance.Between(
                        this.scene.input.pointer1.x,
                        this.scene.input.pointer1.y,
                        this.scene.input.pointer2.x,
                        this.scene.input.pointer2.y
                    );
                    
                    if (!prevDist) {
                        prevDist = dist;
                        pinchStartZoom = this.scene.cameras.main.zoom;
                    }
                    
                    const scaleFactor = dist / prevDist;
                    if (scaleFactor !== 1) {
                        const newZoom = Phaser.Math.Clamp(
                            pinchStartZoom * scaleFactor,
                            this.minZoom,
                            this.maxZoom
                        );
                        this.scene.cameras.main.setZoom(newZoom);
                    }
                } else {
                    prevDist = 0;
                }
            });
        }
    }

    handlePointerDown(pointer) {
        // No mobile ou botão direito no desktop
        if (this.isMobile || pointer.rightButtonDown()) {
            this.isDragging = true;
            this.scene.game.canvas.style.cursor = 'grabbing';
        }
    }

    handlePointerMove(pointer) {
        if (this.isDragging && pointer.prevPosition) {
            const deltaX = pointer.x - pointer.prevPosition.x;
            const deltaY = pointer.y - pointer.prevPosition.y;
            
            // Adiciona um threshold para movimentos pequenos
            const moveThreshold = 2;
            if (Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) {
                this.scene.cameras.main.scrollX -= deltaX / this.scene.cameras.main.zoom;
                this.scene.cameras.main.scrollY -= deltaY / this.scene.cameras.main.zoom;
            }
        }
    }

    handlePointerUp() {
        this.isDragging = false;
        this.scene.game.canvas.style.cursor = 'default';
    }
}
