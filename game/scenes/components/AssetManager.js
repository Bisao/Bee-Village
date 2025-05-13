export default class AssetManager {
    constructor(scene) {
        this.scene = scene;
    }

    loadAssets() {
        this.loadTiles();
        this.loadBuildings();
        this.loadEnvironment();
        this.loadUI();
        this.loadCharacters();
    }

    loadTiles() {
        this.scene.load.image('tile_grass', 'attached_assets/tile_grass.png');
        this.scene.load.image('tile_dirt', 'attached_assets/tile_dirt.png');
    }

    loadBuildings() {
        this.scene.load.image('lumberHouse', 'attached_assets/lumberHouse.png');
        this.scene.load.image('silo', 'attached_assets/silo.png');
        this.scene.load.image('farmerHouse', 'attached_assets/farmerHouse.png');
        this.scene.load.image('FishermanHouse', 'attached_assets/FishermanHouse.png');
        this.scene.load.image('minerHouse', 'attached_assets/minerHouse.png');
    }

    loadEnvironment() {
        this.scene.load.image('tree', 'attached_assets/tree.png');
        this.scene.load.image('rock', 'attached_assets/rock.png');
    }

    loadUI() {
        this.scene.load.image('ui_lumberjack', 'attached_assets/ui_lumberjack.png');
        this.scene.load.image('ui_farmer', 'attached_assets/ui_farmer.png');
        this.scene.load.image('ui_miner', 'attached_assets/ui_miner.png');
        this.scene.load.image('ui_fisherman', 'attached_assets/ui_fisherman.png');
        this.scene.load.image('ui_house', 'attached_assets/ui_house.png');
        this.scene.load.image('ui_silo', 'attached_assets/ui_silo.png');
    }

    loadCharacters() {
        for (let i = 1; i <= 12; i++) {
            this.scene.load.image(`farmer${i}`, `attached_assets/Farmer_${i}-ezgif.com-resize.png`);
        }
    }
}