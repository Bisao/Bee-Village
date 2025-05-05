placeBuilding(gridX, gridY, worldX, worldY) {
    const flashTile = (x, y) => {
        const tile = this.grid.grid[y][x];
        if (tile) {
            this.tweens.add({
                targets: tile,
                alpha: { from: 1, to: 0.5 },
                yoyo: true,
                duration: 200,
                ease: 'Power2'
            });
        }
    };

    //rest of the placeBuilding function would go here.
}