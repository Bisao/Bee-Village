import BaseScene from './BaseScene.js';
import Grid from './components/Grid.js';

export default class GameScene extends BaseScene {
    constructor() {
        super({ key: 'GameScene' });
        this.structuresPanel = null;
    }

    preload() {
        // Load building textures
        this.load.image('ChickenHouse', 'game/assets/buildings/ChickenHouse.png');
        this.load.image('CowHouse', 'game/assets/buildings/CowHouse.png');
        this.load.image('FarmerHouse', 'game/assets/buildings/FarmerHouse.png');
        this.load.image('MinerHouse', 'game/assets/buildings/MinerHouse.png');
        this.load.image('PigHouse', 'game/assets/buildings/PigHouse.png');
        this.load.image('FishermanHouse', 'game/assets/buildings/fishermanHouse.png');

        // Carrega as texturas dos tiles
        this.load.image('tile_grass', 'game/assets/tiles/tile_grass.png');
        this.load.image('tile_grass_2', 'game/assets/tiles/tile_grass_2.png');
        this.load.image('tile_grass_2_flowers', 'game/assets/tiles/tile_grass_2_flowers.png');
        this.load.image('tile_grass_3_flowers', 'game/assets/tiles/tile_grass_3_flowers.png');
    }

    create() {
        super.create();
        this.grid = new Grid(this, 10, 10);
        this.grid.create();
        this.setupViewport();
        this.createStructuresPanel();
        this.setupEventListeners();
    }

    setupViewport() {
        const topBarHeight = 50;
        const viewportWidth = this.scale.width;
        const viewportHeight = this.scale.height - topBarHeight;

        // Center camera on grid
        const gridCenter = {
            x: (this.grid.width * this.grid.tileWidth) / 2,
            y: (this.grid.height * this.grid.tileHeight) / 2
        };
        this.cameras.main.centerOn(gridCenter.x, gridCenter.y);

        // Set initial zoom
        const initialZoom = this.calculateInitialZoom(viewportWidth, viewportHeight);
        this.cameras.main.setZoom(initialZoom);
    }

    calculateInitialZoom(viewportWidth, viewportHeight) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobile ? 0.8 : 1.5;
    }

    createStructuresPanel() {
        const panelWidth = Math.min(300, this.scale.width * 0.8);
        const panelHeight = Math.min(400, this.scale.height * 0.7);
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.structuresPanel = this.add.container(centerX, centerY);

        const background = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x2d2d2d)
            .setOrigin(0.5)
            .setAlpha(0.9);

        this.structuresPanel.add(background);
        this.structuresPanel.setScrollFactor(0);
        this.structuresPanel.setDepth(1000);
        this.structuresPanel.setVisible(false);
    }

    setupEventListeners() {
        this.scale.on('resize', this.handleResize, this);

        // Add other event listeners as needed
        this.events.on('shutdown', () => {
            this.scale.off('resize', this.handleResize, this);
        });
    }

    handleResize(gameSize) {
        const topBarHeight = 50;
        const viewportWidth = gameSize.width;
        const viewportHeight = gameSize.height - topBarHeight;

        // Update viewport
        this.cameras.main.setViewport(0, topBarHeight, viewportWidth, viewportHeight);

        // Recalculate UI positions
        if (this.structuresPanel) {
            this.structuresPanel.setPosition(gameSize.width / 2, gameSize.height / 2);
        }
    }
}