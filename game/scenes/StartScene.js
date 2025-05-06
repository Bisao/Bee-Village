
import Phaser from 'phaser';

export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Título
        const title = this.add.text(width / 2, height / 3, 'My Village', {
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

        // Botão de Configurações
        const settingsButton = this.add.text(width / 2, height / 2 + 60, 'Configurações', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#2196F3',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive();

        // Eventos dos botões
        playButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        settingsButton.on('pointerdown', () => {
            // Implementar menu de configurações
            console.log('Abrir configurações');
        });
    }
}
