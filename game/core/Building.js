
export default class Building {
    constructor(scene, gridX, gridY, type) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.type = type;
        this.sprite = null;
    }

    create(worldX, worldY) {
        this.sprite = this.scene.add.sprite(worldX, worldY, this.type);
        const scale = (this.scene.grid.tileWidth * 1.4) / this.sprite.width;
        this.sprite.setScale(scale);
        this.sprite.setOrigin(0.5, 0.75);
        this.sprite.setDepth(this.gridY + 1);
        return this;
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
