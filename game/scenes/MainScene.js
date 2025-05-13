import InitializationManager from './game/scenes/components/InitializationManager.js';
import AssetManager from './game/scenes/components/AssetManager.js';
import SaveManager from './game/scenes/components/SaveManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.initManager = null;
        this.assetManager = null;
        this.saveManager = null;
    }

    preload() {
        // Inicialização dos managers principais
        this.initManager = new InitializationManager(this);
        this.assetManager = new AssetManager(this);
        this.saveManager = new SaveManager(this);

        // Carrega assets iniciais
        this.initManager.preload();
    }

    create() {
        // Verifica se os assets principais foram carregados
        if (!this.textures.exists('tile_grass')) {
            return;
        }

        // Inicializa os sistemas principais
        this.initManager.initializeManagers();
        this.initManager.setupInitialState();

        // Setup de auto-save
        this.time.addEvent({
            delay: 60000, // 1 minuto
            callback: () => this.saveManager.autoSave(),
            loop: true
        });
    }

    update() {
        // Update principal do jogo
        // Os managers específicos lidam com suas próprias atualizações
        this.events.emit('update');
    }
}