export default class Grid {
    constructor(scene) {
        this.scene = scene;
        this.width = 20;
        this.height = 20;
        this.tileWidth = 64;
        this.tileHeight = 64;
        this.grid = [];
        this.buildingGrid = {};
        this.initialize();
    }

    initialize() {
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const isoPos = this.gridToIso(x, y);
                const tile = this.scene.add.sprite(
                    this.scene.cameras.main.centerX + isoPos.tileX,
                    this.scene.cameras.main.centerY + isoPos.tileY,
                    'tile_grass'
                );
                tile.setOrigin(0.5, 0.75);
                tile.setInteractive();
                tile.data = { gridX: x, gridY: y };
                this.grid[y][x] = tile;
            }
        }
    }

    gridToIso(x, y) {
        const tileX = (x - y) * this.tileWidth / 2;
        const tileY = (x + y) * this.tileHeight / 4;
        return { tileX, tileY };
    }

    isoToGrid(x, y) {
        const gridX = (x / this.tileWidth + y / this.tileHeight * 2) / 2;
        const gridY = (y / this.tileHeight * 2 - x / this.tileWidth) / 2;
        return { gridX: Math.floor(gridX), gridY: Math.floor(gridY) };
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
}