
export default class MobileUI {
    constructor(scene) {
        this.scene = scene;
    }

    createUI() {
        this.createControlPanel();
        this.createMobileButtons();
        this.createCompactTopBar();
    }

    createControlPanel() {
        const controlsPanel = document.getElementById('controls-panel');
        if (controlsPanel) {
            controlsPanel.style.display = 'flex';
        }
    }

    createMobileButtons() {
        const mobileButtons = ['up', 'down', 'left', 'right'].map(direction => {
            const btn = document.querySelector(`.mobile-${direction}`);
            if (btn) {
                this.setupMobileButton(btn, direction);
            }
            return btn;
        });
    }

    setupMobileButton(button, direction) {
        const key = direction.charAt(0);
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

    createCompactTopBar() {
        // Mobile usa a mesma topbar do HTML
        return;
    }
}
