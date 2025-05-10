
export default class FarmingSystem {
    constructor(scene) {
        this.scene = scene;
        this.crops = {};
        this.cropTypes = {
            potato: { emoji: '🥔', time: 30000, value: 50, yield: [1, 3] },
            carrot: { emoji: '🥕', time: 25000, value: 40, yield: [2, 4] },
            wheat: { emoji: '🌾', time: 20000, value: 30, yield: [3, 6] },
            corn: { emoji: '🌽', time: 35000, value: 60, yield: [1, 2] }
        };
        this.growthStages = {
            planted: '🌱',
            growing: '🌿',
            ready: ''  // Set dynamically based on crop type
        };
        this.growthTimes = {
            firstStage: 15000,
            finalStage: 30000,
        };
    }

    getAvailableFarmingTiles(npc) {
        const tiles = [];
        const range = 3; // 3 tiles range

        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                const x = npc.gridX + dx;
                const y = npc.gridY + dy;
                
                // Check if tile is within range and plantable
                if (this.isTilePlantable(x, y) && 
                    Math.abs(dx) + Math.abs(dy) <= range) {
                    tiles.push({x, y});
                }
            }
        }
        return tiles;
    }

    startNPCFarming(npc) {
        if (!npc.farming) {
            npc.farming = {
                isActive: true,
                currentCrop: null,
                harvestedCrops: {}
            };
            
            // Start farming cycle
            this.performFarmingCycle(npc);
        }
    }

    async performFarmingCycle(npc) {
        if (!npc.farming?.isActive) return;

        // Find available tile
        const tiles = this.getAvailableFarmingTiles(npc);
        if (tiles.length > 0) {
            const tile = tiles[Math.floor(Math.random() * tiles.length)];
            
            // Move to tile
            await this.moveNPCToTile(npc, tile);
            
            // Plant crop
            const cropType = this.getRandomCropType();
            this.plantCrop(tile.x, tile.y, cropType, npc);
        }

        // Check for harvestable crops
        const readyCrops = this.getReadyCrops();
        for (const crop of readyCrops) {
            if (this.isInRange(npc, crop.x, crop.y, 3)) {
                await this.moveNPCToTile(npc, crop);
                const harvested = this.harvestCrop(crop.x, crop.y);
                if (harvested) {
                    if (!npc.farming.harvestedCrops[harvested]) {
                        npc.farming.harvestedCrops[harvested] = 0;
                    }
                    npc.farming.harvestedCrops[harvested]++;
                }
            }
        }

        // Continue cycle
        setTimeout(() => this.performFarmingCycle(npc), 5000);
    }

    moveNPCToTile(npc, tile) {
        return new Promise(resolve => {
            npc.moveTo(tile.x, tile.y);
            // Wait for movement animation
            setTimeout(resolve, 1000);
        });
    }

    plantCrop(x, y, cropType, npc = null) {
        const key = `${x},${y}`;
        if (this.crops[key]) return false;

        const position = this.scene.grid.gridToIso(x, y);
        this.crops[key] = {
            type: cropType,
            state: 'planted',
            plantedAt: Date.now(),
            plantedBy: npc?.config.name || 'Player',
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
        setTimeout(() => this.evolveCrop(key), this.growthTimes.firstStage);

        return true;
    }

    evolveCrop(key) {
        const crop = this.crops[key];
        if (!crop) return;

        if (crop.state === 'planted') {
            crop.state = 'growing';
            crop.display.setText(this.growthStages.growing);

            setTimeout(() => {
                if (this.crops[key]) {
                    this.crops[key].state = 'ready';
                    this.growthStages.ready = this.cropTypes[crop.type].emoji;
                    this.crops[key].display.setText(this.growthStages.ready);
                }
            }, this.growthTimes.finalStage - this.growthTimes.firstStage);
        }
    }

    harvestCrop(x, y) {
        const key = `${x},${y}`;
        const crop = this.crops[key];

        if (!crop || crop.state !== 'ready') return null;

        const cropType = crop.type;
        const yieldRange = this.cropTypes[cropType].yield;
        const amount = Phaser.Math.Between(yieldRange[0], yieldRange[1]);

        crop.display.destroy();
        crop.progressBar.destroy();
        delete this.crops[key];

        return cropType;
    }

    getRandomCropType() {
        const types = Object.keys(this.cropTypes);
        return types[Math.floor(Math.random() * types.length)];
    }

    isInRange(npc, x, y, range) {
        const dx = Math.abs(npc.gridX - x);
        const dy = Math.abs(npc.gridY - y);
        return dx + dy <= range;
    }

    isTilePlantable(x, y) {
        const key = `${x},${y}`;
        return !this.crops[key] && 
               !this.scene.grid.buildingGrid[key] &&
               this.scene.grid.isValidPosition(x, y);
    }

    getReadyCrops() {
        return Object.entries(this.crops)
            .filter(([_, crop]) => crop.state === 'ready')
            .map(([key, _]) => {
                const [x, y] = key.split(',').map(Number);
                return {x, y};
            });
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
        crop.progressBar.fillStyle(0x000000, 0.5);
        crop.progressBar.fillRect(
            this.scene.cameras.main.centerX + position.tileX - barWidth/2,
            this.scene.cameras.main.centerY + position.tileY - 40,
            barWidth,
            barHeight
        );
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
}
