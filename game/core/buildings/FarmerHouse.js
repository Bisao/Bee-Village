
import Building from '../Building.js';

export default class FarmerHouse extends Building {
    constructor(scene, gridX, gridY) {
        super(scene, gridX, gridY, 'farmerHouse');
        this.farmer = null;
    }

    create(worldX, worldY) {
        super.create(worldX, worldY);
        this.scene.time.delayedCall(1000, () => {
            this.createFarmer(worldX, worldY);
        });
        return this;
    }

    createFarmer(worldX, worldY) {
        this.scene.createFarmerNPC(this.gridX, this.gridY, worldX, worldY);
    }
}
