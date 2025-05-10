export default class MobileManager {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchStartPos = null;
        this.setupMobileControls();
        this.setupTouchHandlers();
        this.setupOrientationHandler();
    }

    setupMobileControls() {
        if (!this.isMobile) return;

        const controlsPanel = document.getElementById('controls-panel');
        if (controlsPanel) {
            controlsPanel.style.display = 'flex';
        }
    }

    setupTouchHandlers() {
        this.scene.input.on('pointerdown', (pointer) => {
            this.touchStartPos = { x: pointer.x, y: pointer.y };
            this.provideTactileFeedback();
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (this.touchStartPos) {
                const deltaX = pointer.x - this.touchStartPos.x;
                const deltaY = pointer.y - this.touchStartPos.y;
                this.handlePanGesture(deltaX, deltaY);
            }
        });

        this.scene.input.on('pointerup', () => {
            this.touchStartPos = null;
        });
    }

    setupOrientationHandler() {
        window.addEventListener('orientationchange', () => {
            this.handleOrientation();
        });
    }

    handlePanGesture(deltaX, deltaY) {
        if (Math.abs(deltaX) > 50) {
            // Pan camera
            this.scene.cameras.main.scrollX -= deltaX / 2;
        }
        if (Math.abs(deltaY) > 50) {
            this.scene.cameras.main.scrollY -= deltaY / 2;
        }
    }

    provideTactileFeedback() {
        if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        
        // Visual feedback
        const circle = this.scene.add.circle(
            this.touchStartPos.x,
            this.touchStartPos.y,
            20,
            0xffffff,
            0.5
        );
        
        this.scene.tweens.add({
            targets: circle,
            scale: 1.5,
            alpha: 0,
            duration: 150,
            onComplete: () => circle.destroy()
        });
    }

    handleOrientation() {
        const orientation = window.orientation;
        const isLandscape = Math.abs(orientation) === 90;
        
        if (this.scene.screenManager) {
            this.scene.screenManager.adjustAllElements();
        }
        
        // Adjust camera zoom based on orientation
        const zoom = isLandscape ? 0.8 : 0.6;
        this.scene.cameras.main.setZoom(zoom);
    }

    destroy() {
        const controlsPanel = document.getElementById('controls-panel');
        if (controlsPanel) {
            controlsPanel.style.display = 'none';
        }
    }
}
export default class MobileManager {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        if (this.isMobile) {
            this.setupMobileControls();
        }
    }

    setupMobileControls() {
        // Mobile controls setup will be implemented here
    }
}
