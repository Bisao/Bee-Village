
import InitializationManager from './components/InitializationManager.js';
import AssetManager from './components/AssetManager.js';
import SaveManager from './components/SaveManager.js';
import Grid from './components/Grid.js';
import ScreenManager from './components/ScreenManager.js';
import StateManager from './components/StateManager.js';
import InputManager from './components/InputManager.js';
import ResourceSystem from './components/ResourceSystem.js';
import BuildingManager from './components/BuildingManager.js';
import NPCManager from './components/NPCManager.js';
import GridManager from './components/GridManager.js';
import ProfessionManager from './components/ProfessionManager.js';
import EnvironmentManager from './components/EnvironmentManager.js';
import MovementManager from './components/MovementManager.js';
import FeedbackManager from './components/FeedbackManager.js';
import UpdateManager from './components/UpdateManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.initManager = null;
        this.assetManager = null;
        this.saveManager = null;
        this.screenManager = null;
        this.stateManager = null;
        this.inputManager = null;
        this.resourceSystem = null;
        this.buildingManager = null;
        this.npcManager = null;
        this.gridManager = null;
        this.professionManager = null;
        this.environmentManager = null;
        this.movementManager = null;
        this.feedbackManager = null;
        this.updateManager = null;
    }

    preload() {
        // Inicialização dos managers principais
        this.initManager = new InitializationManager(this);
        this.assetManager = new AssetManager(this);
        this.saveManager = new SaveManager(this);
        this.screenManager = new ScreenManager(this);
        this.feedbackManager = new FeedbackManager(this);

        // Carrega assets iniciais
        this.initManager.preload();
    }

    create() {
        // Verifica se os assets principais foram carregados
        if (!this.textures.exists('tile_grass')) {
            this.feedbackManager.showFeedback('Erro ao carregar texturas', false);
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

        // Inicializa o update manager
        this.updateManager = new UpdateManager(this);
    }

    update() {
        // Update principal do jogo
        if (this.updateManager) {
            this.updateManager.update();
        }
    }
}
