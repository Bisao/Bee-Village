
import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js';

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Título
        this.add.text(width / 2, height / 3, 'My Village', {
            fontSize: '64px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Botão de Play
        const playButton = this.add.text(width / 2, height / 2, 'Jogar', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive();

        playButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });
    }
}

export default StartScene;
