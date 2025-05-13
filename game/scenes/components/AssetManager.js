
export default class AssetManager {
    constructor(scene) {
        this.scene = scene;
    }

    loadAssets() {
        if (this.scene.textures.exists('tile_grass')) return;

        this.loadFarmerSprites();
        this.loadTiles();
        this.loadEnvironmentAssets();
        this.loadBuildingAssets();
    }

    loadFarmerSprites() {
        for (let i = 1; i <= 12; i++) {
            this.scene.load.image(`farmer${i}`, `game/assets/shared/Farmer_${i}-ezgif.com-resize.png`);
        }
    }

    loadTiles() {
        const tiles = [
            'tile_grass',
            'tile_grass_2',
            'tile_grass_2_flowers',
            'tile_grass_3_flowers'
        ];

        tiles.forEach(tile => {
            this.scene.load.image(tile, `game/assets/tiles/${tile}.png`);
        });
    }

    loadEnvironmentAssets() {
        const rocks = [
            { key: 'rock_small', path: 'small_rock.png' },
            { key: 'rock_medium', path: '2_rock.png' },
            { key: 'rock_large', path: 'big_rock.png' }
        ];

        rocks.forEach(rock => {
            this.scene.load.image(rock.key, `game/assets/rocks/${rock.path}`);
        });

        const trees = [
            { key: 'tree_simple', path: 'tree_simple.png' },
            { key: 'tree_pine', path: 'tree_pine.png' },
            { key: 'tree_fruit', path: 'tree_autumn.png' }
        ];

        trees.forEach(tree => {
            this.scene.load.image(tree.key, `game/assets/trees/${tree.path}`);
        });
    }

    loadBuildingAssets() {
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
