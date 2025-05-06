
class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        // Carrega recursos necessários
        this.load.setBaseURL(window.location.href);
        this.load.image('background', 'game/assets/tiles/tile_grass.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Adiciona background
        this.add.tileSprite(0, 0, width * 2, height * 2, 'background');

        // Adiciona título
        const title = this.add.text(width / 2, height / 3, 'My Village', {
            fontSize: '64px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Adiciona botão de início
        const playButton = this.add.rectangle(width / 2, height / 2, 200, 50, 0x4CAF50);
        const playText = this.add.text(width / 2, height / 2, 'Iniciar Jogo', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Torna o botão interativo
        playButton.setInteractive();
        playButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        // Efeito hover
        playButton.on('pointerover', () => {
            playButton.setFillStyle(0x45a049);
        });
        playButton.on('pointerout', () => {
            playButton.setFillStyle(0x4CAF50);
        });
    }
}

window.StartScene = StartScene;
