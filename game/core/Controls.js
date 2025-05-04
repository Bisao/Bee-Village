
export class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.setupTouchControls();
    }

    setupTouchControls() {
        this.touchStartTime = 0;
        this.isDragging = false;
        
        this.scene.input.on('pointerdown', this.onPointerDown.bind(this));
        this.scene.input.on('pointermove', this.onPointerMove.bind(this));
        this.scene.input.on('pointerup', this.onPointerUp.bind(this));
        
        // Configuração de pinça para zoom
        this.scene.input.addPointer(1);
        this.prevDist = 0;
        this.lastZoomTime = 0;
    }

    onPointerDown(pointer) {
        this.touchStartTime = Date.now();
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
    }

    onPointerMove(pointer) {
        const now = Date.now();
        if (this.scene.input.pointer1.isDown && this.scene.input.pointer2.isDown) {
            const dx = this.scene.input.pointer1.x - this.scene.input.pointer2.x;
            const dy = this.scene.input.pointer1.y - this.scene.input.pointer2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (this.prevDist > 0 && (now - this.lastZoomTime > 16)) {
                const delta = dist - this.prevDist;
                const zoom = this.scene.cameras.main.zoom;
                const newZoom = zoom + (delta * 0.002);
                this.scene.cameras.main.setZoom(
                    Phaser.Math.Clamp(newZoom, this.scene.minZoom, this.scene.maxZoom)
                );
                this.lastZoomTime = now;
            }
            this.prevDist = dist;
        } else if (this.isDragging) {
            this.handleDrag(pointer);
        }
    }

    onPointerUp(pointer) {
        const touchDuration = Date.now() - this.touchStartTime;
        const dragDistance = Phaser.Math.Distance.Between(
            this.dragStartX, this.dragStartY, pointer.x, pointer.y
        );
        
        if (touchDuration < 200 && dragDistance < 10) {
            this.scene.handleClick(pointer);
        }
        this.isDragging = false;
    }

    handleDrag(pointer) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;
        
        this.scene.cameras.main.scrollX -= deltaX;
        this.scene.cameras.main.scrollY -= deltaY;
        
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
    }
}

export class DesktopControls {
    constructor(scene) {
        this.scene = scene;
        this.setupMouseControls();
    }

    setupMouseControls() {
        this.isDragging = false;
        
        this.scene.input.on('pointerdown', this.onPointerDown.bind(this));
        this.scene.input.on('pointermove', this.onPointerMove.bind(this));
        this.scene.input.on('pointerup', () => this.isDragging = false);
        this.scene.input.on('wheel', this.onWheel.bind(this));
    }

    onPointerDown(pointer) {
        if (pointer.rightButtonDown()) {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
        } else {
            this.scene.handleClick(pointer);
        }
    }

    onPointerMove(pointer) {
        if (this.isDragging) {
            this.handleDrag(pointer);
        }
    }

    onWheel(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        const zoom = this.scene.cameras.main.zoom;
        const newZoom = zoom - (deltaY * 0.001);
        this.scene.cameras.main.setZoom(
            Phaser.Math.Clamp(newZoom, this.scene.minZoom, this.scene.maxZoom)
        );
    }

    handleDrag(pointer) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;
        
        this.scene.cameras.main.scrollX -= deltaX;
        this.scene.cameras.main.scrollY -= deltaY;
        
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
    }
}
