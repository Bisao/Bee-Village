
import BaseNPC from './BaseNPC.js';

export default class Miner extends BaseNPC {
    constructor(scene, gridX, gridY) {
        super(scene, gridX, gridY, 'minerHouse');
        this.productionRate = 15;
        this.lastProduction = 0;
    }

    create(worldX, worldY) {
        super.create(worldX, worldY);
        this.setupProduction();
    }

    setupProduction() {
        this.productionTimer = this.scene.time.addEvent({
            delay: 60000,
            callback: this.produce,
            callbackScope: this,
            loop: true
        });
    }

    produce() {
        if (!this.isAutonomous) return;
        
        const production = this.productionRate;
        if (this.scene.stateManager) {
            const currentState = this.scene.stateManager.getState();
            this.scene.stateManager.setState({
                resources: {
                    ...currentState.resources,
                    stone: currentState.resources.stone + production
                }
            });
        }
        this.lastProduction = Date.now();
    }

    destroy() {
        if (this.productionTimer) {
            this.productionTimer.destroy();
        }
        super.destroy();
    }
}
