
import { CAMERA_CONFIG } from '../../constants/GameConfig.js';

export default class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.isDragging = false;
        this.minZoom = CAMERA_CONFIG.MIN_ZOOM;
        this.maxZoom = CAMERA_CONFIG.MAX_ZOOM;
        this.isMobile = this.detectMobile();
        this.touchManager = new TouchManager(this);
        this.mouseManager = new MouseManager(this);
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        this.setupInputHandlers();
        if (this.isMobile) {
            this.touchManager.init();
        } else {
            this.mouseManager.init();
        }
    }

    setupInputHandlers() {
        this.scene.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.scene.input.on('pointerdown', this.handlePointerDown, this);
        this.scene.input.on('pointermove', this.handlePointerMove, this);
        this.scene.input.on('pointerup', this.handlePointerUp, this);
    }

    handlePointerDown(pointer) {
        if (this.isMobile) {
            this.touchManager.handlePointerDown(pointer);
        } else {
            this.mouseManager.handlePointerDown(pointer);
        }
    }

    handlePointerMove(pointer) {
        if (this.isMobile) {
            this.touchManager.handlePointerMove(pointer);
        } else {
            this.mouseManager.handlePointerMove(pointer);
        }
    }

    handlePointerUp() {
        if (this.isMobile) {
            this.touchManager.handlePointerUp();
        } else {
            this.mouseManager.handlePointerUp();
        }
    }
}

class TouchManager {
    constructor(inputManager) {
        this.inputManager = inputManager;
        this.scene = inputManager.scene;
        this.prevDist = 0;
        this.isDragging = false;
        this.lastCenterX = 0;
        this.lastCenterY = 0;
    }

    init() {
        this.scene.input.addPointer(1);
    }

    handlePointerDown(pointer) {
        if (this.scene.input.pointer1.isDown && !this.scene.input.pointer2.isDown) {
            this.isDragging = true;
        }
    }

    handlePointerMove(pointer) {
        if (this.isDragging && !this.scene.input.pointer2.isDown) {
            this.handleDrag(pointer);
        } else if (this.scene.input.pointer1.isDown && this.scene.input.pointer2.isDown) {
            this.handlePinchZoom();
        }
    }

    handleDrag(pointer) {
        this.scene.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.scene.cameras.main.zoom;
        this.scene.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.scene.cameras.main.zoom;
    }

    handlePinchZoom() {
        const pointer1 = this.scene.input.pointer1;
        const pointer2 = this.scene.input.pointer2;
        
        const centerX = (pointer1.x + pointer2.x) / 2;
        const centerY = (pointer1.y + pointer2.y) / 2;
        
        const dist = Phaser.Math.Distance.Between(
            pointer1.x, pointer1.y,
            pointer2.x, pointer2.y
        );
        
        if (this.prevDist) {
            const diff = this.prevDist - dist;
            const zoom = this.scene.cameras.main.zoom;
            const newZoom = zoom - (diff * 0.001);
            this.scene.cameras.main.setZoom(
                Phaser.Math.Clamp(newZoom, this.inputManager.minZoom, this.inputManager.maxZoom)
            );
        }
        
        this.prevDist = dist;
        this.lastCenterX = centerX;
        this.lastCenterY = centerY;
    }

    handlePointerUp() {
        this.isDragging = false;
        this.prevDist = 0;
    }
}

class MouseManager {
    constructor(inputManager) {
        this.inputManager = inputManager;
        this.scene = inputManager.scene;
    }

    init() {
        this.scene.input.on('wheel', this.handleWheel, this);
    }

    handlePointerDown(pointer) {
        if (pointer.rightButtonDown()) {
            this.inputManager.isDragging = true;
            this.scene.game.canvas.style.cursor = 'grabbing';
        }
    }

    handlePointerMove(pointer) {
        if (this.inputManager.isDragging) {
            this.scene.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.scene.cameras.main.zoom;
            this.scene.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.scene.cameras.main.zoom;
        }
    }

    handlePointerUp() {
        this.inputManager.isDragging = false;
        this.scene.game.canvas.style.cursor = 'default';
    }

    handleWheel(pointer, gameObjects, deltaX, deltaY) {
        const zoom = this.scene.cameras.main.zoom;
        const newZoom = zoom - (deltaY * (window.innerWidth < 768 ? 0.0005 : 0.001));
        this.scene.cameras.main.setZoom(
            Phaser.Math.Clamp(newZoom, this.inputManager.minZoom, this.inputManager.maxZoom)
        );
    }
}
