
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
        const topBar = this.scene.add.rectangle(0, 0, window.innerWidth, 40, 0x2d2d2d);
        topBar.setOrigin(0, 0);
        topBar.setScrollFactor(0);
        topBar.setDepth(1000);

        const titleText = this.scene.add.text(10, 10, '🌻 My Village', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        titleText.setScrollFactor(0);
        titleText.setDepth(1000);
    }
}
