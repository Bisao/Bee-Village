
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

        const resources = [
            { icon: '🪙', value: '1000' },
            { icon: '🪵', value: '50' },
            { icon: '🪨', value: '30' }
        ];

        resources.forEach((resource, index) => {
            const y = index * 30;
            const text = this.scene.add.text(0, y, `${resource.icon} ${resource.value}`, {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: '#2d2d2d',
                padding: { x: 10, y: 5 }
            });
            resourceBar.add(text);
        });

        this.uiElements.set('resourceBar', resourceBar);
    }

    setupResizeHandlers() {
        window.addEventListener('resize', () => {
            const resourceBar = this.uiElements.get('resourceBar');
            if (resourceBar) {
                resourceBar.setPosition(window.innerWidth - 200, 60);
            }
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

    setupTabHandlers(panel) {
        const tabs = panel.querySelectorAll('.tab-btn');
        const contents = panel.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const content = panel.querySelector(`#${tab.dataset.tab}-tab`);
                if (content) content.classList.add('active');
            });
        });
    }

    clearBuildingSelection() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(b => b.classList.remove('selected'));
        this.scene.selectedBuilding = null;
        if (this.scene.previewBuilding) {
            this.scene.previewBuilding.destroy();
            this.scene.previewBuilding = null;
        }
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
}
