
export default class UIController {
    constructor(scene) {
        this.scene = scene;
        this.uiElements = new Map();
    }

    init() {
        this.setupUIHandlers();
        this.createSidePanel();
        this.createBuildingButtons();
        this.createResourcePanel(); 
        this.setupResizeHandlers();
        this.createTopBar();
    }

    showFeedback(message, success = true) {
        const text = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            message,
            { 
                fontSize: '16px',
                fill: success ? '#4CAF50' : '#f44336',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 20,
            duration: 5000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    setupUIHandlers() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.scene.selectedBuilding = btn.dataset.building;
                if (this.scene.previewBuilding) {
                    this.scene.previewBuilding.destroy();
                    this.scene.previewBuilding = null;
                }
                document.getElementById('side-panel').style.display = 'none';
            });
        });

        const toggleButton = document.getElementById('toggleStructures');
        const sidePanel = document.getElementById('side-panel');

        if (toggleButton && sidePanel) {
            toggleButton.addEventListener('click', () => {
                const isVisible = sidePanel.style.display === 'flex';
                sidePanel.style.display = isVisible ? 'none' : 'flex';
                if (!isVisible) {
                    this.clearBuildingSelection();
                }
            });
        }
    }

    clearBuildingSelection() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(b => b.classList.remove('selected'));
        if (this.scene.previewBuilding) {
            this.scene.previewBuilding.destroy();
            this.scene.previewBuilding = null;
        }
        this.scene.selectedBuilding = null;
    }

    createSidePanel() {
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) {
            sidePanel.style.display = 'none';
            this.setupTabHandlers(sidePanel);
        }
    }

    createBuildingButtons() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.scene.selectedBuilding = btn.dataset.building;
                if (this.scene.previewBuilding) {
                    this.scene.previewBuilding.destroy();
                    this.scene.previewBuilding = null;
                }
                document.getElementById('side-panel').style.display = 'none';
            });
        });
    }

    createResourcePanel() {
        const resourceBar = this.scene.add.container(window.innerWidth - 200, 60);
        resourceBar.setScrollFactor(0).setDepth(1000);
        this.uiElements.set('resourceBar', resourceBar);
    }

    setupResizeHandlers() {
        window.addEventListener('resize', () => {
            const resourceBar = this.uiElements.get('resourceBar');
            if (resourceBar) {
                resourceBar.setPosition(window.innerWidth - 200, 60);
            }
            const topBarBg = this.uiElements.get('topBarBg');
            if (topBarBg) {
                topBarBg.width = window.innerWidth;
            }
        });
    }

    createTopBar() {
        const topBarBg = this.scene.add.rectangle(0, 0, window.innerWidth, 50, 0x2d2d2d);
        topBarBg.setOrigin(0, 0);
        topBarBg.setScrollFactor(0);
        topBarBg.setDepth(1000);
        this.uiElements.set('topBarBg', topBarBg);

        const saveIcon = this.scene.add.text(10, 15, '💾', {
            fontSize: '20px'
        }).setScrollFactor(0).setDepth(1000);
        this.uiElements.set('saveIcon', saveIcon);

        const titleText = this.scene.add.text(50, 15, 'My Village', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setScrollFactor(0).setDepth(1000);
        this.uiElements.set('titleText', titleText);
    }
}
