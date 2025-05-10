
export default class DesktopUI {
    constructor(scene) {
        this.scene = scene;
        this.uiElements = new Map();
    }

    createUI() {
        this.createTopBar();
        this.createSidePanel();
        this.createBuildingButtons();
        this.createResourcePanel();
        this.setupResizeHandlers();
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

        const menuButton = this.scene.add.text(window.innerWidth - 50, 15, '☰', {
            fontSize: '24px',
            color: '#ffffff'
        }).setScrollFactor(0).setDepth(1000).setInteractive();
        
        menuButton.on('pointerover', () => {
            menuButton.setTint(0xffff00);
        });
        menuButton.on('pointerout', () => {
            menuButton.clearTint();
        });
        this.uiElements.set('menuButton', menuButton);
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

    createSidePanel() {
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) {
            sidePanel.style.display = 'none';
            this.setupTabHandlers(sidePanel);
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

            // Add hover effects
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.05)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });
        });
    }

    setupResizeHandlers() {
        this.scene.scale.on('resize', (gameSize) => {
            const { width, height } = gameSize;
            
            // Update top bar
            const topBarBg = this.uiElements.get('topBarBg');
            if (topBarBg) topBarBg.width = width;

            // Update menu button position
            const menuButton = this.uiElements.get('menuButton');
            if (menuButton) menuButton.setPosition(width - 50, 15);

            // Update resource bar position
            const resourceBar = this.uiElements.get('resourceBar');
            if (resourceBar) resourceBar.setPosition(width - 200, 60);
        });
    }

    updateResources(resources) {
        const resourceBar = this.uiElements.get('resourceBar');
        if (!resourceBar || !resourceBar.list) return;

        resourceBar.list.forEach((text, index) => {
            const resource = resources[index];
            if (resource) {
                text.setText(`${resource.icon} ${resource.value}`);
            }
        });
    }
}
