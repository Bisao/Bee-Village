export default class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;
    }

    placeEnvironmentObjects() {
        this.placeTrees();
        this.placeRocks();
    }

    placeTrees() {
        const treeCount = 10;
        for (let i = 0; i < treeCount; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(0, this.scene.grid.width - 1);
                y = Phaser.Math.Between(0, this.scene.grid.height - 1);
            } while (this.scene.gridManager.isTileOccupied(x, y));

            const {tileX, tileY} = this.scene.grid.gridToIso(x, y);
            const worldX = this.scene.cameras.main.centerX + tileX;
            const worldY = this.scene.cameras.main.centerY + tileY;

            const tree = this.scene.add.sprite(worldX, worldY, 'tree');
            tree.setOrigin(0.5, 1);
            tree.setDepth(y);

            const key = `${x},${y}`;
            this.scene.grid.buildingGrid[key] = tree;
        }
    }

    placeRocks() {
        const rockCount = 8;
        for (let i = 0; i < rockCount; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(0, this.scene.grid.width - 1);
                y = Phaser.Math.Between(0, this.scene.grid.height - 1);
            } while (this.scene.gridManager.isTileOccupied(x, y));

            const {tileX, tileY} = this.scene.grid.gridToIso(x, y);
            const worldX = this.scene.cameras.main.centerX + tileX;
            const worldY = this.scene.cameras.main.centerY + tileY;

            const rock = this.scene.add.sprite(worldX, worldY, 'rock_small'); // Or any other rock sprite
            rock.setOrigin(0.5, 1);
            rock.setDepth(y);

            const key = `${x},${y}`;
            this.scene.grid.buildingGrid[key] = rock;
        }
    }
}