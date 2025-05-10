import MobileManager from './components/MobileManager.js';
import AssetCacheManager from '../services/AssetCacheManager.js';

export default class BaseScene extends Phaser.Scene {
    constructor(config) {
        super(config);
        this.screenDimensions = {
            width: window.innerWidth || 800,
            height: window.innerHeight || 600
        };
    }

    init() {
        if (!this.mobileManager) {
            this.mobileManager = new MobileManager(this);
        }
    }

    create() {
        this.assetCache = new AssetCacheManager(this);
        this.screenDimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.setupScreenManager();
    }

    setupScreenManager() {
        // Detecta o tipo de dispositivo
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

        // Configura evento de redimensionamento
        this.scale.on('resize', (gameSize) => {
            this.handleResize(gameSize);
        });

        // Configura dimensões iniciais
        this.updateDimensions();
    }

    handleResize(gameSize) {
        this.screenDimensions = {
            width: gameSize.width,
            height: gameSize.height
        };
        this.updateDimensions();
    }

    updateDimensions() {
        // Atualiza as dimensões da cena
        this.isMobile = this.screenDimensions.width <= 768;
        this.isTablet = this.screenDimensions.width <= 1024 && this.screenDimensions.width > 768;

        // Método a ser sobrescrito pelas scenes filhas
        if (this.onDimensionsUpdate) {
            this.onDimensionsUpdate();
        }
    }

    centerElement(element) {
        element.setPosition(
            this.screenDimensions.width / 2,
            this.screenDimensions.height / 2
        );
    }
}