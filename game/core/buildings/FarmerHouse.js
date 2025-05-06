
import Building from '../Building.js';

export default class FarmerHouse extends Building {
    constructor(scene, gridX, gridY) {
        super(scene, gridX, gridY, 'FarmerHouse');
        this.productionRate = 10; // Moedas por minuto
        this.lastProduction = 0;
        this.workerCapacity = 1;
        this.workers = [];
    }

    create(worldX, worldY) {
        super.create(worldX, worldY);
        this.setupInteractions();
        
        this.scene.time.delayedCall(1000, () => {
            const farmer = new Farmer(this.scene, this.gridX, this.gridY);
            farmer.create(worldX, worldY);
            this.npc = farmer;
        });
    }

    setupProduction() {
        this.productionTimer = this.scene.time.addEvent({
            delay: 60000, // 1 minuto
            callback: this.produce,
            callbackScope: this,
            loop: true
        });
    }

    setupInteractions() {
        this.sprite.setInteractive();
        this.sprite.on('pointerdown', () => {
            this.showInfo();
        });
    }

    produce() {
        if (this.workers.length > 0) {
            const production = this.productionRate * this.workers.length;
            if (this.scene.stateManager) {
                const currentState = this.scene.stateManager.getState();
                this.scene.stateManager.setState({
                    resources: {
                        ...currentState.resources,
                        coins: currentState.resources.coins + production
                    }
                });
            }
            this.lastProduction = Date.now();
        }
    }

    showInfo() {
        const info = {
            type: 'FarmerHouse',
            workers: this.workers.length,
            capacity: this.workerCapacity,
            production: this.productionRate + ' moedas/min'
        };
        this.scene.eventManager?.emit('showBuildingInfo', info);
    }

    addWorker(worker) {
        if (this.workers.length < this.workerCapacity) {
            this.workers.push(worker);
            return true;
        }
        return false;
    }

    removeWorker(workerId) {
        this.workers = this.workers.filter(w => w.id !== workerId);
    }

    destroy() {
        if (this.productionTimer) {
            this.productionTimer.destroy();
        }
        super.destroy();
    }
}
