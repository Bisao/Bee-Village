import Grid from './game/scenes/components/Grid.js';
import InputManager from './game/scenes/components/InputManager.js';
import ResourceSystem from './game/scenes/components/ResourceSystem.js';
import BuildingManager from './game/scenes/components/BuildingManager.js';
import NPCManager from './game/scenes/components/NPCManager.js';
import GridManager from './game/scenes/components/GridManager.js';
import ProfessionManager from './game/scenes/components/ProfessionManager.js';
import EnvironmentManager from './game/scenes/components/EnvironmentManager.js';
import MovementManager from './game/scenes/components/MovementManager.js';
import StateManager from './game/scenes/components/StateManager.js';
import AssetManager from './game/scenes/components/AssetManager.js';
import InitializationManager from './game/scenes/components/InitializationManager.js';
import ScreenManager from './game/scenes/components/ScreenManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.initManager = null;
        this.updateManager = null;
    }

    preload() {
        this.initManager = new InitializationManager(this);
        this.assetManager = new AssetManager(this);
        this.saveManager = new SaveManager(this);
        this.initManager.preload();
    }

    create() {
        if (!this.textures.exists('tile_grass')) {
            return;
        }

        this.initManager.initializeManagers();
        this.initManager.setupInitialState();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.handleMouseMove, this);
    }

    handleClick(pointer) {
        this.inputManager.handleClick(pointer);
    }

    handleMouseMove(pointer) {
        this.inputManager.handleMouseMove(pointer);
    }

    update() {
        if (this.updateManager) {
            this.updateManager.update();
        }
    }

    // UI functionality moved to UIManager
}