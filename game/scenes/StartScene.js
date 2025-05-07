
export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        // Centro da tela
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Fundo
        this.add.rectangle(centerX, centerY, 400, 300, 0x2d2d2d)
            .setStrokeStyle(2, 0xffffff);

        // Título
        this.add.text(centerX, centerY - 80, 'My Village', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Botão Play
        const playButton = this.add.rectangle(centerX, centerY, 200, 50, 0x4a4a4a)
            .setInteractive()
            .setStrokeStyle(2, 0xffffff);
        
        const playText = this.add.text(centerX, centerY, 'Play', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Botão Settings
        const settingsButton = this.add.rectangle(centerX, centerY + 70, 200, 50, 0x4a4a4a)
            .setInteractive()
            .setStrokeStyle(2, 0xffffff);
        
        const settingsText = this.add.text(centerX, centerY + 70, 'Settings', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Hover effects
        [playButton, settingsButton].forEach(button => {
            button.on('pointerover', () => button.setFillStyle(0x666666));
            button.on('pointerout', () => button.setFillStyle(0x4a4a4a));
        });

        // Click handlers
        playButton.on('pointerdown', () => {
            this.scene.start('MainScene');
            this.scene.remove('StartScene');
        });

        settingsButton.on('pointerdown', () => {
            document.getElementById('settings-panel').classList.add('visible');
        });
    }
}
