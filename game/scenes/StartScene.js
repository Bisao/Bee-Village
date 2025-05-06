
class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        // Preload de assets se necessário
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Adiciona um retângulo escuro como fundo
        this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7);

        // Título
        const title = this.add.text(centerX, centerY - 100, 'My Village', {
            fontSize: '64px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Botão de Play
        const playButton = this.add.rectangle(centerX, centerY + 50, 200, 60, 0x4CAF50);
        const playText = this.add.text(centerX, centerY + 50, 'Jogar', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Torna o botão interativo
        playButton.setInteractive();
        playButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });
    }
}

window.StartScene = StartScene;
