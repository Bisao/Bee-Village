
import BaseScene from './BaseScene.js';
import { UI_CONSTANTS } from '../constants/GameConfig.js';
import { ServiceManager } from '../services/ServiceManager.js';

/**
 * @class StartScene
 * @extends BaseScene
 * @description Cena inicial do jogo com menu principal
 */
export default class StartScene extends BaseScene {
    constructor() {
        super({ key: 'StartScene' });
        this.eventManager = null;
        this.uiElements = new Map();
    }

    /**
     * @method create
     * @description Inicializa a cena
     */
    create() {
        try {
            super.create();
            this.eventManager = this.services.getService('memory');
            this.createUI();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error creating StartScene:', error);
            this.services.getService('error').handleError(error);
        }
    }

    /**
     * @method createUI
     * @description Cria elementos da interface
     */
    createUI() {
        const { width, height } = this.screenDimensions;
        const { COLORS, DIMENSIONS, SPACING } = UI_CONSTANTS;

        // Container principal
        this.container = this.add.container(width / 2, height / 2);
        this.uiElements.set('container', this.container);

        // Painel central com validação de dimensões
        const panelWidth = Math.min(DIMENSIONS.PANEL_WIDTH, width * 0.8);
        const panelHeight = Math.min(DIMENSIONS.PANEL_HEIGHT, height * 0.6);
        
        const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, COLORS.BACKGROUND)
            .setStrokeStyle(2, COLORS.STROKE);
        this.uiElements.set('panel', panel);

        // Título com escala responsiva
        const fontSize = Math.min(DIMENSIONS.FONT_SIZE, width * 0.06);
        const title = this.add.text(0, -panelHeight * 0.25, 'My Village', {
            fontSize: `${fontSize}px`,
            fill: COLORS.PRIMARY
        }).setOrigin(0.5);
        this.uiElements.set('title', title);

        // Botões com feedback visual
        this.createButton(0, 0, 'Play', () => {
            this.services.getService('validation').validateTransition('GameScene');
            this.scene.start('GameScene');
        });

        this.createButton(0, DIMENSIONS.BUTTON_HEIGHT * 1.5, 'Settings', () => {
            this.services.getService('validation').validateTransition('SettingsScene');
            this.scene.start('SettingsScene');
        });

        this.container.add([panel, title]);
    }

    /**
     * @method createButton
     * @description Cria um botão interativo
     */
    createButton(x, y, text, callback) {
        const { COLORS, DIMENSIONS } = UI_CONSTANTS;
        const buttonWidth = Math.min(200, this.screenDimensions.width * 0.8);
        
        const button = this.add.rectangle(x, y, buttonWidth, DIMENSIONS.BUTTON_HEIGHT, COLORS.BUTTON)
            .setInteractive()
            .setStrokeStyle(2, COLORS.STROKE);

        const buttonText = this.add.text(x, y, text, {
            fontSize: `${Math.min(24, this.screenDimensions.width * 0.04)}px`,
            fill: COLORS.PRIMARY
        }).setOrigin(0.5);

        // Feedback visual e tátil
        button.on('pointerover', () => {
            button.setFillStyle(COLORS.BUTTON_HOVER);
            this.services.getService('rateLimit').throttle(() => {
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(50);
                }
            }, 100);
        });
        
        button.on('pointerout', () => button.setFillStyle(COLORS.BUTTON));
        button.on('pointerdown', () => {
            if (this.services.getService('validation').validateClick()) {
                callback();
            }
        });

        this.container.add([button, buttonText]);
        this.uiElements.set(`button_${text}`, { button, text: buttonText });
    }

    /**
     * @method setupEventListeners
     * @description Configura listeners de eventos
     */
    setupEventListeners() {
        this.eventManager.registerEvent(this.scale, 'resize', () => {
            this.updateUI();
        });
    }

    /**
     * @method updateUI
     * @description Atualiza posições dos elementos UI
     */
    updateUI() {
        if (this.container) {
            this.container.setPosition(
                this.screenDimensions.width / 2,
                this.screenDimensions.height / 2
            );
        }
    }

    /**
     * @method shutdown
     * @description Limpa recursos ao desativar a cena
     */
    shutdown() {
        this.eventManager.cleanup();
        this.uiElements.clear();
        super.shutdown();
    }
}
