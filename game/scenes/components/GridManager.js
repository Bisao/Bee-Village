
export default class GridManager {
    constructor(scene) {
        this.scene = scene;
    }

    updateTileHighlights() {
        this.scene.grid.grid.flat().forEach(tile => {
            const gridPosition = tile.data;
            const key = `${gridPosition.gridX},${gridPosition.gridY}`;

            if (this.scene.grid.buildingGrid[key]) {
                tile.setTint(0xFF0000);
            } else if (this.isValidGridPosition(gridPosition.gridX, gridPosition.gridY)) {
                tile.setTint(0x00FF00);
            } else {
                tile.setTint(0xFF0000);
            }
        });
    }

    clearTileHighlights() {
        this.scene.grid.grid.flat().forEach(tile => {
            tile.clearTint();
        });
    }

    isValidGridPosition(x, y) {
        return x >= 0 && x < this.scene.grid.width && 
               y >= 0 && y < this.scene.grid.height;
    }
}
