
export default class DesktopUI {
    constructor(scene) {
        this.scene = scene;
    }

    createUI() {
        this.createTopBar();
        this.createSidePanel();
        this.createBuildingButtons();
    }

    createTopBar() {
        const topBar = this.scene.add.rectangle(0, 0, window.innerWidth, 50, 0x2d2d2d);
        topBar.setOrigin(0, 0);
        topBar.setScrollFactor(0);
        topBar.setDepth(1000);

        const saveIndicator = this.scene.add.text(10, 15, '💾', {
            fontSize: '20px'
        });
        saveIndicator.setScrollFactor(0);
        saveIndicator.setDepth(1000);

        const titleText = this.scene.add.text(50, 15, 'My Village', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        titleText.setScrollFactor(0);
        titleText.setDepth(1000);

        this.scene.scale.on('resize', (gameSize) => {
            topBar.width = gameSize.width;
        });
    }

    createSidePanel() {
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) {
            sidePanel.style.display = 'none';
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
}
