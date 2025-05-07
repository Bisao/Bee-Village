
export default class AssetLoader {
    constructor(scene) {
        this.scene = scene;
    }

    loadAll() {
        this.loadNPCs();
        this.loadBuildings();
        this.loadEnvironment();
        this.loadTiles();
    }

    loadNPCs() {
        for (let i = 1; i <= 12; i++) {
            this.scene.load.image(`npc${i}`, `assets/sprites/npcs/Farmer_${i}-ezgif.com-resize.png`);
        }
    }

    loadBuildings() {
        const buildings = ['ChickenHouse', 'CowHouse', 'FarmerHouse', 'MinerHouse', 'PigHouse', 'fishermanHouse'];
        buildings.forEach(building => {
            this.scene.load.image(building, `assets/sprites/buildings/${building}.png`);
        });
    }

    loadEnvironment() {
        // Load trees, rocks and other environment assets
        ['tree_simple', 'tree_pine', 'tree_fruit', 'tree_autumn'].forEach(tree => {
            this.scene.load.image(tree, `assets/sprites/environment/trees/${tree}.png`);
        });
    }

    loadTiles() {
        const tiles = ['grass', 'grass_2', 'grass_2_flowers', 'grass_3_flowers'];
        tiles.forEach(tile => {
            this.scene.load.image(`tile_${tile}`, `assets/sprites/environment/tiles/tile_${tile}.png`);
        });
    }
}
