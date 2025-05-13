
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

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.assetManager = new AssetManager(this);
        this.assetManager.loadAssets();
        this.load.on('complete', () => {
            this.game.events.emit('ready');
        });
    }

    create() {
        if (!this.textures.exists('tile_grass')) {
            return;
        }

        this.initializeManagers();
        this.setupInitialState();
        this.setupEventListeners();
    }

    initializeManagers() {
        this.grid = new Grid(this, 10, 10);
        this.stateManager = new StateManager(this);
        this.inputManager = new InputManager(this);
        this.resourceSystem = new ResourceSystem(this);
        this.buildingManager = new BuildingManager(this);
        this.npcManager = new NPCManager(this);
        this.gridManager = new GridManager(this);
        this.professionManager = new ProfessionManager(this);
        this.environmentManager = new EnvironmentManager(this);
        this.movementManager = new MovementManager(this);
    }

    setupInitialState() {
        this.grid.create();
        this.inputManager.init();
        this.environmentManager.placeInitialEnvironment();

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const initialZoom = isMobile ? 0.8 : 1.5;
        this.cameras.main.setZoom(initialZoom);
    }

    setupEventListeners() {
        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.handleMouseMove, this);
    }

    handleClick(pointer) {
        if (pointer.rightButtonDown()) return;
        // Apenas delega para o BuildingManager se necessário
        if (this.stateManager.getState('buildMode')) {
            this.buildingManager.handleBuildingPlacement(pointer);
        }
    }

    handleMouseMove(pointer) {
        if (this.stateManager.getState('buildMode')) {
            this.buildingManager.updateBuildingPreview(pointer);
        }
    }

    update() {
        // Lógica de update específica da cena principal
        // A maior parte da lógica de update foi movida para seus respectivos managers
    }
}
