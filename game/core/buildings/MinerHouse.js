
import Building from '../Building.js';
import Miner from '../npc/Miner.js';

export default class MinerHouse extends Building {
    constructor(scene, gridX, gridY) {
        super(scene, gridX, gridY, 'MinerHouse');
        this.productionRate = 15;
        this.lastProduction = 0;
        this.workerCapacity = 1;
        this.workers = [];
    }

    create(worldX, worldY) {
        super.create(worldX, worldY);
        this.setupInteractions();
        
        this.scene.time.delayedCall(1000, () => {
            const miner = new Miner(this.scene, this.gridX, this.gridY);
            miner.create(worldX, worldY);
            this.npc = miner;
        });
    }

    setupInteractions() {
        this.sprite.setInteractive();
        this.sprite.on('pointerdown', () => {
            this.showInfo();
        });
    }

    showInfo() {
        const info = {
            type: 'MinerHouse',
            workers: this.workers.length,
            capacity: this.workerCapacity,
            production: this.productionRate + ' pedras/min'
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
        if (this.npc) {
            this.npc.destroy();
        }
        super.destroy();
    }
}
