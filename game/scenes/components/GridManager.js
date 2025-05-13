
export default class GridManager {
    constructor(scene) {
        this.scene = scene;
        this.grid = this.scene.grid;
    }

    clearTileHighlights() {
        this.grid.grid.flat().forEach(tile => {
            tile.clearTint();
        });
    }

    updateTileHighlights() {
        this.grid.grid.flat().forEach(tile => {
            const gridPosition = tile.data;
            const key = `${gridPosition.gridX},${gridPosition.gridY}`;

            if (this.grid.buildingGrid[key]) {
                tile.setTint(0xFF0000);
            } else if (this.isValidGridPosition(gridPosition.gridX, gridPosition.gridY)) {
                tile.setTint(0x00FF00);
            } else {
                tile.setTint(0xFF0000);
            }
        });
    }

    isTileOccupied(x, y) {
        const key = `${x},${y}`;
        const object = this.grid.buildingGrid[key];
        return object && object.type === 'building';
    }

    getAvailableDirections(fromX, fromY) {
        const directions = [
            { x: 1, y: 0 },   // direita
            { x: -1, y: 0 },  // esquerda
            { x: 0, y: 1 },   // baixo
            { x: 0, y: -1 }   // cima
        ];

        return directions.filter(dir => {
            const newX = fromX + dir.x;
            const newY = fromY + dir.y;
            return this.isValidGridPosition(newX, newY) && !this.isTileOccupied(newX, newY);
        });
    }

    isValidGridPosition(x, y) {
        return this.scene.grid.isValidPosition(x, y);
    }

    isTileOccupied(x, y) {
        const key = `${x},${y}`;
        const object = this.scene.grid.buildingGrid[key];
        return object && object.type === 'building';
    }

    getAvailableDirections(fromX, fromY) {
        const directions = [
            { x: 1, y: 0 },   // direita
            { x: -1, y: 0 },  // esquerda
            { x: 0, y: 1 },   // baixo
            { x: 0, y: -1 }   // cima
        ];

        return directions.filter(dir => {
            const newX = fromX + dir.x;
            const newY = fromY + dir.y;
            return this.isValidGridPosition(newX, newY) && !this.isTileOccupied(newX, newY);
        });
    }

    updateTileHighlights() {
        this.scene.grid.grid.flat().forEach(tile => {
            const gridPosition = tile.data;
            const key = `${gridPosition.gridX},${gridPosition.gridY}`;

            if (this.scene.grid.buildingGrid[key]) {
                tile.setTint(0xFF0000); // Occupied - Red
            } else if (this.isValidGridPosition(gridPosition.gridX, gridPosition.gridY)) {
                tile.setTint(0x00FF00); // Available - Green
            } else {
                tile.setTint(0xFF0000); // Invalid - Red
            }
        });
    }

    clearTileHighlights() {
        this.scene.grid.grid.flat().forEach(tile => {
            tile.clearTint();
        });
    }
}
