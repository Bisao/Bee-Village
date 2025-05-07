
export default class FarmingSystem {
    constructor(scene) {
        this.scene = scene;
        this.crops = {};
        this.growthStages = {
            planted: '🌱',
            growing: '🌿',
            ready: '🥔'
        };
        this.growthTimes = {
            firstStage: 15000,  // 15 segundos
            finalStage: 30000  // 30 segundos
        };
    }

    plant(x, y) {
        const key = `${x},${y}`;
        if (this.crops[key]) return false;

        this.crops[key] = {
            state: 'planted',
            plantedAt: Date.now(),
            x: x,
            y: y,
            display: this.scene.add.text(
                this.scene.cameras.main.centerX + this.scene.grid.gridToIso(x, y).tileX,
                this.scene.cameras.main.centerY + this.scene.grid.gridToIso(x, y).tileY - 32,
                this.growthStages.planted
            ).setOrigin(0.5).setDepth(1000)
        };

        // Primeira evolução (planted -> growing)
        setTimeout(() => this.evolve(key), this.growthTimes.firstStage);

        return true;
    }

    evolve(key) {
        const crop = this.crops[key];
        if (!crop) return;

        if (crop.state === 'planted') {
            crop.state = 'growing';
            crop.display.setText(this.growthStages.growing);
            
            // Segunda evolução (growing -> ready)
            setTimeout(() => {
                if (this.crops[key]) {
                    this.crops[key].state = 'ready';
                    this.crops[key].display.setText(this.growthStages.ready);
                }
            }, this.growthTimes.finalStage - this.growthTimes.firstStage);
        }
    }

    harvest(x, y) {
        const key = `${x},${y}`;
        const crop = this.crops[key];
        
        if (!crop || crop.state !== 'ready') return null;

        crop.display.destroy();
        delete this.crops[key];
        return 'potato';
    }

    isTilePlantable(x, y) {
        const key = `${x},${y}`;
        return !this.crops[key] && !this.scene.grid.buildingGrid[key];
    }

    getReadyCrops() {
        return Object.entries(this.crops)
            .filter(([_, crop]) => crop.state === 'ready')
            .map(([key, _]) => {
                const [x, y] = key.split(',').map(Number);
                return {x, y};
            });
    }
}
