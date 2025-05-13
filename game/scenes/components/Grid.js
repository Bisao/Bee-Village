export default class Grid {
    constructor(scene) {
        this.scene = scene;
        this.tileWidth = 64;
        this.tileHeight = 32;
        this.grid = [];
        this.buildingGrid = {};
    }

    create(width, height) {
        for (let y = 0; y < height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < width; x++) {
                const tile = this.createTile(x, y);
                this.grid[y][x] = tile;
            }
        }
    }

    createTile(x, y) {
        const position = this.gridToIso(x, y);
        const tile = this.scene.add.sprite(
            this.scene.cameras.main.centerX + position.tileX,
            this.scene.cameras.main.centerY + position.tileY,
            'tile_grass'
        );

        tile.setDepth(y);
        tile.setInteractive();
        tile.data = { gridX: x, gridY: y };

        return tile;
    }

    gridToIso(x, y) {
        return {
            tileX: (x - y) * this.tileWidth / 2,
            tileY: (x + y) * this.tileHeight / 2
        };
    }

    isoToGrid(x, y) {
        const tileX = Math.round((x / this.tileWidth + y / this.tileHeight));
        const tileY = Math.round((y / this.tileHeight - x / this.tileWidth));
        return { x: tileX, y: tileY };
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.grid[0]?.length && y >= 0 && y < this.grid.length;
    }
}