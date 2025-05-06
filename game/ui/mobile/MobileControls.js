
export default class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.controlsPanel = document.getElementById('controls-panel');
    }

    init() {
        this.setupControls();
    }

    setupControls() {
        const buttons = {
            'mobile-up': 'w',
            'mobile-down': 's',
            'mobile-left': 'a',
            'mobile-right': 'd'
        };

        Object.entries(buttons).forEach(([className, key]) => {
            const button = document.querySelector(`.${className}`);
            if (button) {
                this.setupTouchEvents(button, key);
            }
        });
    }

    setupTouchEvents(button, key) {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.scene.currentControlledNPC) {
                this.scene.currentControlledNPC.controls[key].isDown = true;
            }
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.scene.currentControlledNPC) {
                this.scene.currentControlledNPC.controls[key].isDown = false;
            }
        });
    }

    show() {
        if (this.controlsPanel) {
            this.controlsPanel.style.display = 'flex';
        }
    }

    hide() {
        if (this.controlsPanel) {
            this.controlsPanel.style.display = 'none';
        }
    }
}
