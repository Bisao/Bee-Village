const { Scene } = Phaser;
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        this.add.text(400, 300, 'Clique para começar', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.input.on('pointerdown', () => {
            this.scene.start('MainScene');
        });
    }
}

export default StartScene;