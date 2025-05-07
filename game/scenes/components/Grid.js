
export default class Grid {
    constructor(scene, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.tileWidth = 64;
        this.tileHeight = 64;
        this.grid = [];
        this.buildingGrid = {};
    }

    create() {
        this.visibleTiles = new Set();
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const tile = this.createTile(x, y);
                if (this.isInViewport(x, y)) {
                    this.visibleTiles.add(tile);
                    tile.setVisible(true);
                } else {
                    tile.setVisible(false);
                }
            }
        }
        
        this.scene.cameras.main.on('camerascroll', () => this.updateVisibleTiles());
    }
    
    isInViewport(x, y) {
        return true; // Show all tiles for now
    }
    
    updateVisibleTiles() {
        this.grid.flat().forEach(tile => {
            if (tile) {
                tile.setVisible(true);
            }
        });
    }

    createTile(x, y) {
        const {tileX, tileY} = this.gridToIso(x, y);
        const randomTile = this.getRandomTile(x, y);
        
        const tile = this.scene.add.image(
            this.scene.cameras.main.centerX + tileX,
            this.scene.cameras.main.centerY + tileY,
            randomTile
        );

        tile.displayWidth = this.tileWidth;
        tile.displayHeight = this.tileHeight;
        tile.setOrigin(0.5, 0.75);
        tile.setInteractive();
        tile.data = { gridX: x, gridY: y };

        this.grid[y][x] = tile;
        return tile;
    }

    getRandomTile(x, y) {
        const tileTypes = [
            'tile_grass',
            'tile_grass',
            'tile_grass',
            'tile_grass_2',
            'tile_grass_2',
            'tile_grass_2'
        ];

        if (!this.hasAdjacentFlowers(x, y) && this.getFlowerCount(x, y) < 3 && Math.random() < 0.15) {
            return Math.random() < 0.5 ? 'tile_grass_2_flowers' : 'tile_grass_3_flowers';
        }
        
        return tileTypes[Math.floor(Math.random() * tileTypes.length)];
    }

    hasAdjacentFlowers(x, y) {
        const neighbors = [
            [x-1, y], [x+1, y],
            [x, y-1], [x, y+1],
            [x-1, y-1], [x+1, y-1],
            [x-1, y+1], [x+1, y+1]
        ];
        return neighbors.some(([nx, ny]) => 
            this.grid[ny]?.[nx]?.texture.key.includes('flower')
        );
    }

    getFlowerCount(x, y, radius = 2) {
        let count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (this.grid[ny]?.[nx]?.texture.key.includes('flower')) {
                    count++;
                }
            }
        }
        return count;
    }

    gridToIso(gridX, gridY) {
        return {
            tileX: (gridX - gridY) * this.tileWidth,
            tileY: (gridX + gridY) * this.tileHeight / 2
        };
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    makeTileFarmable(x, y) {
        const key = `${x},${y}`;
        if (!this.farmableTiles) this.farmableTiles = {};
        
        this.farmableTiles[key] = {
            state: 'tilled', // tilled, seeded, growing, ready
            crop: null,
            plantedAt: null,
            tile: this.grid[y][x]
        };

        // Atualizar visual do tile
        this.grid[y][x].setTint(0x886644);
    }

    plantCrop(x, y, cropType) {
        const key = `${x},${y}`;
        if (!this.farmableTiles || !this.farmableTiles[key]) return false;
        
        const farmTile = this.farmableTiles[key];
        if (farmTile.state !== 'tilled') return false;

        farmTile.state = 'seeded';
        farmTile.crop = cropType;
        farmTile.plantedAt = Date.now();
        
        // Atualizar visual
        this.grid[y][x].setTint(0x558833);
        
        // Iniciar crescimento
        this.startGrowthCycle(x, y);
        return true;
    }

    startGrowthCycle(x, y) {
        const key = `${x},${y}`;
        const farmTile = this.farmableTiles[key];
        if (!farmTile) return;

        const growthTime = this.getCropGrowthTime(farmTile.crop);
        
        this.scene.time.delayedCall(growthTime, () => {
            if (farmTile.state === 'seeded') {
                farmTile.state = 'ready';
                this.grid[y][x].setTint(0x44FF44);
            }
        });
    }

    getCropGrowthTime(cropType) {
        const times = {
            'potato': 20000,  // 20 segundos
            'tomato': 15000,  // 15 segundos
            'pumpkin': 25000  // 25 segundos
        };
        return times[cropType] || 20000;
    }

    harvestCrop(x, y) {
        const key = `${x},${y}`;
        if (!this.farmableTiles || !this.farmableTiles[key]) return null;
        
        const farmTile = this.farmableTiles[key];
        if (farmTile.state !== 'ready') return null;
        
        const harvestedCrop = farmTile.crop;
        farmTile.state = 'tilled';
        farmTile.crop = null;
        farmTile.plantedAt = null;
        
        // Resetar visual
        this.grid[y][x].setTint(0x886644);
        
        return harvestedCrop;
    }
}
