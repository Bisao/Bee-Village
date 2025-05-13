export default class AssetLoader {
    constructor(scene) {
        this.scene = scene;
    }

    loadGameAssets() {
        // Cache de texturas para otimização
        if (this.scene.textures.exists("tile_grass")) return;

        // Load farmer sprites
        for (let i = 1; i <= 12; i++) {
            this.scene.load.image(`farmer${i}`, `game/assets/shared/Farmer_${i}-ezgif.com-resize.png`);
        }

        // Load tiles
        const tiles = [
            "tile_grass",
            "tile_grass_2",
            "tile_grass_2_flowers",
            "tile_grass_3_flowers"
        ];

        tiles.forEach(tile => {
            this.scene.load.image(tile, `game/assets/tiles/${tile}.png`);
        });

        // Load rocks
        const rocks = [
            { key: "rock_small", path: "game/assets/rocks/small_rock.png" },
            { key: "rock_medium", path: "game/assets/rocks/2_rock.png" },
            { key: "rock_large", path: "game/assets/rocks/big_rock.png" }
        ];

        rocks.forEach(rock => {
            this.scene.load.image(rock.key, rock.path);
        });

        // Load trees
        const trees = [
            { key: "tree_simple", path: "game/assets/trees/tree_simple.png" },
            { key: "tree_pine", path: "game/assets/trees/tree_pine.png" },
            { key: "tree_fruit", path: "game/assets/trees/tree_autumn.png" }
        ];

        trees.forEach(tree => {
            this.scene.load.image(tree.key, tree.path);
        });

        // Load buildings
        const buildings = [
            "silo|Silo",
            "well|WaterWell",
            "windmill|Windmill",
            "farmerHouse|FarmerHouse",
            "FishermanHouse|FishermanHouse",
            "lumberHouse|LumberJackHouse",
            "minerHouse|MinerHouse"
        ];

        buildings.forEach(building => {
            const [key, filename] = building.split("|");
            this.scene.load.image(key, `game/assets/buildings/${filename}.png`);
        });

        // Emit ready event when loading is complete
        this.scene.load.on("complete", () => {
            this.scene.game.events.emit("ready");
        });
    }
}

