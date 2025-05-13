
import Grid from './Grid.js';
import StateManager from './StateManager.js';
import InputManager from './InputManager.js';
import ResourceSystem from './ResourceSystem.js';
import BuildingManager from './BuildingManager.js';
import NPCManager from './NPCManager.js';
import GridManager from './GridManager.js';
import ProfessionManager from './ProfessionManager.js';
import EnvironmentManager from './EnvironmentManager.js';
import MovementManager from './MovementManager.js';
import ScreenManager from './ScreenManager.js';

export default class InitializationManager {
    constructor(scene) {
        this.scene = scene;
        this.managers = new Map();
    }

    preload() {
        this.scene.assetManager.loadAssets();
        this.scene.load.on('complete', () => {
            this.scene.game.events.emit('ready');
        });
    }

    initializeManagers() {
        this.scene.grid = new Grid(this.scene, 10, 10);
        this.scene.stateManager = new StateManager(this.scene);
        this.scene.inputManager = new InputManager(this.scene);
        this.scene.resourceSystem = new ResourceSystem(this.scene);
        this.scene.buildingManager = new BuildingManager(this.scene);
        this.scene.npcManager = new NPCManager(this.scene);
        this.scene.gridManager = new GridManager(this.scene);
        this.scene.professionManager = new ProfessionManager(this.scene);
        this.scene.environmentManager = new EnvironmentManager(this.scene);
        this.scene.movementManager = new MovementManager(this.scene);
    }

    setupInitialState() {
        this.scene.grid.create();
        this.scene.inputManager.init();
        this.scene.environmentManager.placeInitialEnvironment();
        this.scene.screenManager.initializeCamera();
    }

    loadAssets() {
        if (this.scene.textures.exists('tile_grass')) return;

        // Load farmer sprites
        for (let i = 1; i <= 12; i++) {
            this.scene.load.image(`farmer${i}`, `game/assets/shared/Farmer_${i}-ezgif.com-resize.png`);
        }

        // Load tiles
        const tiles = [
            'tile_grass',
            'tile_grass_2',
            'tile_grass_2_flowers',
            'tile_grass_3_flowers'
        ];

        tiles.forEach(tile => {
            this.scene.load.image(tile, `game/assets/tiles/${tile}.png`);
        });

        // Load rocks
        const rocks = [
            { key: 'rock_small', path: 'game/assets/rocks/small_rock.png' },
            { key: 'rock_medium', path: 'game/assets/rocks/2_rock.png' },
            { key: 'rock_large', path: 'game/assets/rocks/big_rock.png' }
        ];

        rocks.forEach(rock => {
            this.scene.load.image(rock.key, rock.path);
        });

        // Load trees
        const trees = [
            { key: 'tree_simple', path: 'game/assets/trees/tree_simple.png' },
            { key: 'tree_pine', path: 'game/assets/trees/tree_pine.png' },
            { key: 'tree_fruit', path: 'game/assets/trees/tree_autumn.png' }
        ];

        trees.forEach(tree => {
            this.scene.load.image(tree.key, tree.path);
        });

        // Load buildings
        const buildings = [
            'silo|Silo',
            'well|WaterWell',
            'windmill|Windmill',
            'farmerHouse|FarmerHouse',
            'FishermanHouse|FishermanHouse',
            'lumberHouse|LumberJackHouse',
            'minerHouse|MinerHouse'
        ];

        buildings.forEach(building => {
            const [key, filename] = building.split('|');
            this.scene.load.image(key, `game/assets/buildings/${filename}.png`);
        });
    }
}
