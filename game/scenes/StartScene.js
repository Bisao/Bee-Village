
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        // Preload assets if needed
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Título
        const title = this.add.text(width / 2, height / 3, 'My Village', {
            fontSize: '64px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Efeito de flutuação no título
        this.tweens.add({
            targets: title,
            y: title.y + 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Botão de Play
        const playButton = this.add.text(width / 2, height / 2, 'Jogar', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 },
            stroke: '#000000',
            strokeThickness: 4
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Efeitos do botão
        playButton.on('pointerover', () => {
            playButton.setScale(1.1);
        });

        playButton.on('pointerout', () => {
            playButton.setScale(1);
        });

        playButton.on('pointerdown', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('MainScene');
            });
        });
    }
}

export { StartScene as default };
