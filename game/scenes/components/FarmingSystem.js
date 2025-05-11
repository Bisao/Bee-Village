export default class FarmingSystem {
    constructor(scene) {
        this.scene = scene;
        this.crops = {};
        this.cropTypes = {
            potato: { emoji: '🥔', time: 30000, value: 50 },
            carrot: { emoji: '🥕', time: 25000, value: 40 },
            wheat: { emoji: '🌾', time: 20000, value: 30 },
            corn: { emoji: '🌽', time: 35000, value: 60 }
        };
        this.growthStages = {
            planted: '🌱',
            growing: '🌿',
            ready: ''  // Será definido dinamicamente baseado no tipo de cultura
        };
        this.growthTimes = {
            firstStage: 15000,    // 15 segundos para primeira evolução (🌱 -> 🌿)
            finalStage: 30000,    // 30 segundos total (mais 15 segundos para 🌿 -> 🥔)
        };
    }

    plant(x, y) {
        const key = `${x},${y}`;
        if (this.crops[key]) return false;

        const position = this.scene.grid.gridToIso(x, y);
        this.crops[key] = {
            state: 'planted',
            plantedAt: Date.now(),
            x: x,
            y: y,
            display: this.scene.add.text(
                this.scene.cameras.main.centerX + position.tileX,
                this.scene.cameras.main.centerY + position.tileY - 32,
                this.growthStages.planted
            ).setOrigin(0.5).setDepth(1000),
            progressBar: this.scene.add.graphics()
        };

        this.updateGrowthProgress(key);
        // Primeira evolução (planted -> growing)
        setTimeout(() => this.evolve(key), this.growthTimes.firstStage);

        return true;
    }

    updateGrowthProgress(key) {
        const crop = this.crops[key];
        if (!crop) return;

        const elapsed = Date.now() - crop.plantedAt;
        const total = this.growthTimes.finalStage;
        const progress = Math.min(elapsed / total, 1);

        const position = this.scene.grid.gridToIso(crop.x, crop.y);
        const barWidth = 32;
        const barHeight = 4;

        crop.progressBar.clear();
        // Fundo da barra
        crop.progressBar.fillStyle(0x000000, 0.5);
        crop.progressBar.fillRect(
            this.scene.cameras.main.centerX + position.tileX - barWidth/2,
            this.scene.cameras.main.centerY + position.tileY - 40,
            barWidth,
            barHeight
        );
        // Progresso
        crop.progressBar.fillStyle(0x00ff00, 1);
        crop.progressBar.fillRect(
            this.scene.cameras.main.centerX + position.tileX - barWidth/2,
            this.scene.cameras.main.centerY + position.tileY - 40,
            barWidth * progress,
            barHeight
        );

        if (progress < 1) {
            setTimeout(() => this.updateGrowthProgress(key), 1000);
        }
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
                    //Definindo o emoji correto para o estado 'ready'
                    const cropType = Object.keys(this.cropTypes).find(type => this.cropTypes[type].time === this.growthTimes.finalStage);
                    this.growthStages.ready = this.cropTypes[cropType].emoji;
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