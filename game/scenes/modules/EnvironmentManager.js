export default class EnvironmentManager {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.environmentObjects = []; // To keep track of placed environment objects if needed
    }

    placeInitialScenery() {
        this.placeRocks();
        this.placeTrees();
    }

    placeRocks() {
        const rockTypes = ["rock_small", "rock_medium", "rock_large"];
        this.placeObjects(rockTypes, 8, "rock");
    }

    placeTrees() {
        const treeTypes = ["tree_simple", "tree_pine", "tree_fruit"];
        this.placeObjects(treeTypes, 15, "tree");
    }

    placeObjects(types, count, objectType) {
        let placed = 0;
        let attempts = 0; // To prevent infinite loops if grid is full
        while (placed < count && attempts < count * 5) {
            attempts++;
            const randomX = Math.floor(Math.random() * this.grid.width);
            const randomY = Math.floor(Math.random() * this.grid.height);
            const key = `${randomX},${randomY}`;

            // Check if tile is already occupied by a building or another environment object
            if (this.grid.buildingGrid[key]) continue;

            try {
                const randomType = types[Math.floor(Math.random() * types.length)];
                const { tileX, tileY } = this.grid.gridToIso(randomX, randomY);

                const object = this.scene.add.image(
                    this.scene.cameras.main.centerX + tileX,
                    this.scene.cameras.main.centerY + tileY - (this.grid.tileHeight / (objectType === "tree" ? 2 : 4)), // Adjust Y for better visual placement
                    randomType
                );

                object.setDepth(randomY + 1); // Depth based on Y grid position
                const baseScaleWidth = this.grid.tileWidth * (objectType === "tree" ? 1.8 : 0.8);
                const scale = baseScaleWidth / Math.max(object.width, 1); // Avoid division by zero if width is 0
                object.setScale(scale);
                object.setOrigin(0.5, 0.8); // Adjust origin for better footing

                // Register the object in the grid so it can be interacted with or avoided
                this.grid.buildingGrid[key] = {
                    sprite: object,
                    type: objectType, // "rock" or "tree"
                    gridX: randomX,
                    gridY: randomY,
                    isEnvironment: true // Custom flag
                };
                this.environmentObjects.push(this.grid.buildingGrid[key]);

                placed++;
            } catch (error) {
                console.error(`Error placing ${objectType} (${randomType}):`, error);
                // If an asset is missing, this might throw. AssetLoader should ensure assets are ready.
                continue;
            }
        }
        if (placed < count) {
            console.warn(`Could only place ${placed}/${count} ${objectType}s.`);
        }
    }

    // Helper for systems like LumberSystem or MineSystem
    findClosestTree(x, y, range) {
        let closestTree = null;
        let minDistance = Infinity;
        this.environmentObjects.forEach(obj => {
            if (obj.type === "tree") {
                const distance = Phaser.Math.Distance.Between(x, y, obj.gridX, obj.gridY);
                if (distance < minDistance && distance <= range) {
                    minDistance = distance;
                    closestTree = obj;
                }
            }
        });
        return closestTree;
    }

    findClosestRock(x, y, range) {
        let closestRock = null;
        let minDistance = Infinity;
        this.environmentObjects.forEach(obj => {
            if (obj.type === "rock") {
                const distance = Phaser.Math.Distance.Between(x, y, obj.gridX, obj.gridY);
                if (distance < minDistance && distance <= range) {
                    minDistance = distance;
                    closestRock = obj;
                }
            }
        });
        return closestRock;
    }

    removeObject(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        const obj = this.grid.buildingGrid[key];
        if (obj && obj.isEnvironment) {
            if (obj.sprite) {
                obj.sprite.destroy();
            }
            delete this.grid.buildingGrid[key];
            this.environmentObjects = this.environmentObjects.filter(o => !(o.gridX === gridX && o.gridY === gridY));
            console.log(`Removed environment object at ${gridX}, ${gridY}`);
            return true;
        }
        return false;
    }
}

