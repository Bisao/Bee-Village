
import BaseScene from './BaseScene.js';

export default class StartScene extends BaseScene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        // Load any assets needed for the start scene
    }

    create() {
        super.create();
        
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Title
        const title = this.add.text(centerX, centerY - 100, 'My Village', {
            fontSize: '64px',
            fill: '#FFD700',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Create animated title
        this.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Play Button
        const playButton = this.add.rectangle(centerX, centerY, 200, 50, 0x4a4a4a)
            .setInteractive()
            .setStrokeStyle(2, 0xFFD700);

        const playText = this.add.text(centerX, centerY, 'Play', {
            fontSize: '32px',
            fill: '#FFD700'
        }).setOrigin(0.5);

        // Settings Button
        const settingsButton = this.add.rectangle(centerX, centerY + 70, 200, 50, 0x4a4a4a)
            .setInteractive()
            .setStrokeStyle(2, 0xFFD700);

        const settingsText = this.add.text(centerX, centerY + 70, 'Settings', {
            fontSize: '32px',
            fill: '#FFD700'
        }).setOrigin(0.5);

        // Button interactions
        playButton.on('pointerover', () => {
            playButton.setFillStyle(0x666666);
        });
        playButton.on('pointerout', () => {
            playButton.setFillStyle(0x4a4a4a);
        });
        playButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        settingsButton.on('pointerover', () => {
            settingsButton.setFillStyle(0x666666);
        });
        settingsButton.on('pointerout', () => {
            settingsButton.setFillStyle(0x4a4a4a);
        });
        settingsButton.on('pointerdown', () => {
            this.scene.start('SettingsScene');
        });
    }

    onDimensionsUpdate() {
        // Handle screen resize if needed
        this.create();
    }
}
