
import BaseScene from './BaseScene.js';

export default class StartScene extends BaseScene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        super.create();
        this.createUI();
    }

    createUI() {
        const width = this.screenDimensions.width;
        const height = this.screenDimensions.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Calcula tamanhos relativos
        const panelWidth = Math.min(400, width * 0.8);
        const panelHeight = Math.min(300, height * 0.6);
        const buttonWidth = Math.min(200, panelWidth * 0.8);
        const buttonHeight = Math.min(50, panelHeight * 0.2);
        const fontSize = Math.min(32, width * 0.06);

        // Container para centralizar todos os elementos
        this.container = this.add.container(centerX, centerY);
        
        // Painel central
        this.panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x2d2d2d)
            .setStrokeStyle(2, 0xffffff);
        
        // Título
        this.title = this.add.text(0, -panelHeight * 0.25, 'My Village', {
            fontSize: `${fontSize}px`,
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Botões
        this.createButton(0, 0, buttonWidth, buttonHeight, 'Play', fontSize * 0.75, () => {
            this.scene.start('GameScene');
        });

        this.createButton(0, buttonHeight * 1.5, buttonWidth, buttonHeight, 'Settings', fontSize * 0.75, () => {
            this.scene.start('SettingsScene');
        });

        // Adiciona elementos ao container
        this.container.add([this.panel, this.title]);
    }

    createButton(x, y, width, height, text, fontSize, callback) {
        const button = this.add.rectangle(x, y, width, height, 0x4a4a4a)
            .setInteractive()
            .setStrokeStyle(2, 0xffffff);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: `${fontSize}px`,
            fill: '#ffffff'
        }).setOrigin(0.5);

        button.on('pointerover', () => button.setFillStyle(0x666666));
        button.on('pointerout', () => button.setFillStyle(0x4a4a4a));
        button.on('pointerdown', callback);

        this.container.add([button, buttonText]);
    }

    onDimensionsUpdate() {
        if (this.container) {
            this.createUI();
        }
    }
}
