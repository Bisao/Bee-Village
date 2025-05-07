
export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        // Pega as dimensões atuais da tela
        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Calcula tamanhos relativos
        const panelWidth = Math.min(400, width * 0.8);
        const panelHeight = Math.min(300, height * 0.6);
        const buttonWidth = Math.min(200, panelWidth * 0.8);
        const buttonHeight = Math.min(50, panelHeight * 0.2);
        const fontSize = Math.min(32, width * 0.06);

        // Painel central
        this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x2d2d2d)
            .setStrokeStyle(2, 0xffffff);

        // Título
        this.add.text(centerX, centerY - panelHeight * 0.3, 'My Village', {
            fontSize: `${fontSize}px`,
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Botão Play
        const playButton = this.add.rectangle(centerX, centerY, buttonWidth, buttonHeight, 0x4a4a4a)
            .setInteractive()
            .setStrokeStyle(2, 0xffffff);
        
        const playText = this.add.text(centerX, centerY, 'Play', {
            fontSize: `${fontSize * 0.75}px`,
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Botão Settings
        const settingsButton = this.add.rectangle(centerX, centerY + buttonHeight * 1.5, buttonWidth, buttonHeight, 0x4a4a4a)
            .setInteractive()
            .setStrokeStyle(2, 0xffffff);
        
        const settingsText = this.add.text(centerX, centerY + buttonHeight * 1.5, 'Settings', {
            fontSize: `${fontSize * 0.75}px`,
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Efeitos de hover
        [playButton, settingsButton].forEach(button => {
            button.on('pointerover', () => button.setFillStyle(0x666666));
            button.on('pointerout', () => button.setFillStyle(0x4a4a4a));
        });

        // Click handlers
        playButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        settingsButton.on('pointerdown', () => {
            this.scene.start('SettingsScene');
        });

        // Listener para redimensionamento
        this.scale.on('resize', this.resize, this);
    }

    resize(gameSize) {
        // Atualiza posições quando a tela é redimensionada
        if (this.scene.isActive()) {
            this.scene.restart();
        }
    }
}
