
class BuildingPanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;
        this.init();
    }

    init() {
        this.createPanel();
        this.createToggleButton();
        this.createBuildingButtons();
        this.scene.add.existing(this);
    }

    createPanel() {
        const panelWidth = 200;
        const panelHeight = 400;

        this.panel = this.scene.add.graphics();
        this.panel.fillStyle(0x2c3e50, 0.9);
        this.panel.fillRect(0, 0, panelWidth, panelHeight);
        this.add(this.panel);

        const title = this.scene.add.text(10, 10, 'Estruturas', { 
            fontSize: '20px', 
            fill: '#fff',
            fontFamily: 'Arial'
        });
        this.add(title);
    }

    createToggleButton() {
        const panelWidth = 200;
        const toggleButton = this.scene.add.graphics();
        toggleButton.fillStyle(0x34495e, 1);
        toggleButton.fillRect(panelWidth + 10, 0, 30, 30);
        toggleButton.setInteractive(new Phaser.Geom.Rectangle(panelWidth + 10, 0, 30, 30), Phaser.Geom.Rectangle.Contains);

        const toggleIcon = this.scene.add.text(panelWidth + 20, 5, '<', { 
            fontSize: '20px',
            fill: '#fff' 
        });

        this.add(toggleButton);
        this.add(toggleIcon);

        toggleButton.on('pointerdown', () => {
            this.panel.visible = !this.panel.visible;
            toggleIcon.setText(this.panel.visible ? '<' : '>');
            this.buildings.forEach(building => {
                building.visible = this.panel.visible;
            });
        });
    }

    createBuildingButtons() {
        this.buildings = [];
        const buildings = [
            { key: 'farmerHouse', name: 'Casa do Fazendeiro' },
            { key: 'cowHouse', name: 'Estábulo' },
            { key: 'chickenHouse', name: 'Galinheiro' },
            { key: 'pigHouse', name: 'Chiqueiro' },
            { key: 'minerHouse', name: 'Casa do Minerador' },
            { key: 'fishermanHouse', name: 'Casa do Pescador' }
        ];

        buildings.forEach((building, index) => {
            const y = 50 + (index * 55);
            const panelWidth = 200;

            const button = this.scene.add.graphics();
            button.fillStyle(0x34495e, 0.8);
            button.fillRect(10, y, panelWidth - 20, 45);
            button.setInteractive(new Phaser.Geom.Rectangle(10, y, panelWidth - 20, 45), Phaser.Geom.Rectangle.Contains);

            const text = this.scene.add.text(20, y + 12, building.name, { 
                fontSize: '16px', 
                fill: '#fff',
                fontFamily: 'Arial'
            });

            const thumbnail = this.scene.add.image(panelWidth - 35, y + 22, building.key);
            const scale = 40 / thumbnail.height;
            thumbnail.setScale(scale);

            button.on('pointerdown', () => {
                this.scene.events.emit('buildingSelected', building.key);
            });

            button.on('pointerover', () => {
                button.clear();
                button.fillStyle(0x3498db, 0.8);
                button.fillRect(10, y, panelWidth - 20, 45);
            });

            button.on('pointerout', () => {
                button.clear();
                button.fillStyle(0x34495e, 0.8);
                button.fillRect(10, y, panelWidth - 20, 45);
            });

            this.add([button, text, thumbnail]);
            this.buildings.push(button, text, thumbnail);
        });
    }

    contains(x, y) {
        const bounds = this.getBounds();
        return bounds.contains(x, y);
    }
}

export default BuildingPanel;
