
export default class FarmingSystem {
    constructor(scene) {
        this.scene = scene;
        this.crops = {};
        this.cropTypes = {
            potato: { emoji: '🥔', time: 30000, value: 50, yield: [1, 3], season: 'spring' },
            carrot: { emoji: '🥕', time: 25000, value: 40, yield: [2, 4], season: 'spring' },
            wheat: { emoji: '🌾', time: 20000, value: 30, yield: [3, 6], season: 'summer' },
            corn: { emoji: '🌽', time: 35000, value: 60, yield: [1, 2], season: 'summer' },
            pumpkin: { emoji: '🎃', time: 40000, value: 70, yield: [1, 2], season: 'fall' },
            tomato: { emoji: '🍅', time: 28000, value: 45, yield: [2, 4], season: 'summer' }
        };
        this.soilStates = {
            untilled: '⬜',
            tilled: '🟫',
            watered: '💧'
        };
        this.growthStages = {
            planted: '🌱',
            growing: '🌿',
            ready: '' // Set dynamically based on crop type
        };
        this.growthTimes = {
            firstStage: 15000,
            finalStage: 30000,
        };
        this.weatherConditions = ['sunny', 'rainy', 'cloudy'];
        this.currentWeather = 'sunny';
        this.weatherEffects = {
            sunny: { growthMultiplier: 1.2, waterDrain: 1.5 },
            rainy: { growthMultiplier: 1.0, waterDrain: 0 },
            cloudy: { growthMultiplier: 0.8, waterDrain: 0.5 }
        };
    }

    getAvailableFarmingTiles(npc) {
        const tiles = [];
        const range = 3;

        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                const x = npc.gridX + dx;
                const y = npc.gridY + dy;
                
                if (this.isTilePlantable(x, y) && 
                    Math.abs(dx) + Math.abs(dy) <= range &&
                    this.isNearHouse(x, y, npc)) {
                    tiles.push({x, y});
                }
            }
        }
        return tiles;
    }

    isNearHouse(x, y, npc) {
        const houseKey = `${npc.gridX},${npc.gridY}`;
        const house = this.scene.grid.buildingGrid[houseKey];
        return house && house.type === 'building';
    }

    startNPCFarming(npc) {
        if (!npc.farming) {
            npc.farming = {
                isActive: true,
                currentCrop: null,
                harvestedCrops: {},
                inventory: {
                    seeds: {},
                    tools: {
                        hoe: true,
                        wateringCan: true
                    }
                },
                experience: 0,
                level: 1
            };
            
            this.performFarmingCycle(npc);
        }
    }

    async performFarmingCycle(npc) {
        if (!npc.farming?.isActive) return;

        // Update weather periodically
        if (Math.random() < 0.1) {
            this.updateWeather();
        }

        // Find available tile
        const tiles = this.getAvailableFarmingTiles(npc);
        const readyCrops = this.getReadyCrops();

        // Prioritize harvesting ready crops
        for (const crop of readyCrops) {
            if (this.isInRange(npc, crop.x, crop.y, 3)) {
                await this.moveNPCToTile(npc, crop);
                const harvested = this.harvestCrop(crop.x, crop.y, npc);
                if (harvested) {
                    this.updateNPCExperience(npc, 10);
                }
            }
        }

        // Plant new crops if there's space
        if (tiles.length > 0) {
            const tile = tiles[Math.floor(Math.random() * tiles.length)];
            await this.moveNPCToTile(npc, tile);
            
            // Till soil first
            await this.tillSoil(tile.x, tile.y, npc);
            
            // Plant crop
            const cropType = this.getSeasonalCrop();
            const planted = this.plantCrop(tile.x, tile.y, cropType, npc);
            
            if (planted) {
                await this.waterCrop(tile.x, tile.y, npc);
                this.updateNPCExperience(npc, 5);
            }
        }

        // Maintain existing crops
        Object.entries(this.crops).forEach(([key, crop]) => {
            if (crop.needsWater && this.isInRange(npc, crop.x, crop.y, 3)) {
                this.waterCrop(crop.x, crop.y, npc);
            }
        });

        // Continue cycle
        setTimeout(() => this.performFarmingCycle(npc), 5000);
    }

    updateNPCExperience(npc, amount) {
        npc.farming.experience += amount;
        if (npc.farming.experience >= 100) {
            npc.farming.level++;
            npc.farming.experience = 0;
            // Could add level-up benefits here
        }
    }

    async tillSoil(x, y, npc) {
        const key = `${x},${y}`;
        const position = this.scene.grid.gridToIso(x, y);
        
        // Create soil state indicator
        if (!this.soilStates[key]) {
            this.soilStates[key] = {
                state: 'untilled',
                display: this.scene.add.text(
                    this.scene.cameras.main.centerX + position.tileX,
                    this.scene.cameras.main.centerY + position.tileY - 32,
                    this.soilStates.untilled
                ).setOrigin(0.5).setDepth(999)
            };
        }

        // Tilling animation/delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.soilStates[key].state = 'tilled';
        this.soilStates[key].display.setText(this.soilStates.tilled);
    }

    async waterCrop(x, y, npc) {
        const key = `${x},${y}`;
        const crop = this.crops[key];
        if (!crop) return;

        // Watering animation/delay
        await new Promise(resolve => setTimeout(resolve, 800));
        crop.needsWater = false;
        crop.lastWatered = Date.now();
        
        // Update soil state
        if (this.soilStates[key]) {
            this.soilStates[key].display.setText(this.soilStates.watered);
        }
    }

    updateWeather() {
        const prevWeather = this.currentWeather;
        this.currentWeather = this.weatherConditions[
            Math.floor(Math.random() * this.weatherConditions.length)
        ];
        
        if (prevWeather !== this.currentWeather) {
            this.applyWeatherEffects();
        }
    }

    applyWeatherEffects() {
        const effect = this.weatherEffects[this.currentWeather];
        Object.values(this.crops).forEach(crop => {
            crop.growthMultiplier = effect.growthMultiplier;
            if (effect.waterDrain > 0) {
                crop.needsWater = true;
            }
        });
    }

    getSeasonalCrop() {
        // In a real implementation, you'd track seasons
        const season = 'spring';
        const seasonalCrops = Object.entries(this.cropTypes)
            .filter(([_, crop]) => crop.season === season)
            .map(([name, _]) => name);
        
        return seasonalCrops[Math.floor(Math.random() * seasonalCrops.length)];
    }

    moveNPCToTile(npc, tile) {
        return new Promise(resolve => {
            npc.moveTo(tile.x, tile.y);
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
            needsWater: true,
            lastWatered: null,
            growthMultiplier: this.weatherEffects[this.currentWeather].growthMultiplier,
            display: this.scene.add.text(
                this.scene.cameras.main.centerX + position.tileX,
                this.scene.cameras.main.centerY + position.tileY - 32,
                this.growthStages.planted
            ).setOrigin(0.5).setDepth(1000),
            progressBar: this.scene.add.graphics()
        };

        this.updateGrowthProgress(key);
        setTimeout(() => this.evolveCrop(key), 
            this.growthTimes.firstStage * (1 / this.crops[key].growthMultiplier));

        return true;
    }

    evolveCrop(key) {
        const crop = this.crops[key];
        if (!crop) return;

        if (crop.state === 'planted') {
            crop.state = 'growing';
            crop.display.setText(this.growthStages.growing);

            const remainingTime = (this.growthTimes.finalStage - this.growthTimes.firstStage) * 
                (1 / crop.growthMultiplier);

            setTimeout(() => {
                if (this.crops[key]) {
                    this.crops[key].state = 'ready';
                    this.growthStages.ready = this.cropTypes[crop.type].emoji;
                    this.crops[key].display.setText(this.growthStages.ready);
                }
            }, remainingTime);
        }
    }

    harvestCrop(x, y, npc = null) {
        const key = `${x},${y}`;
        const crop = this.crops[key];

        if (!crop || crop.state !== 'ready') return null;

        const cropType = crop.type;
        const yieldRange = this.cropTypes[cropType].yield;
        const amount = Phaser.Math.Between(yieldRange[0], yieldRange[1]);

        // Clean up
        crop.display.destroy();
        crop.progressBar.destroy();
        if (this.soilStates[key]) {
            this.soilStates[key].display.destroy();
            delete this.soilStates[key];
        }
        delete this.crops[key];

        // Update NPC inventory
        if (npc && npc.farming) {
            if (!npc.farming.harvestedCrops[cropType]) {
                npc.farming.harvestedCrops[cropType] = 0;
            }
            npc.farming.harvestedCrops[cropType] += amount;
        }

        return cropType;
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
        const total = this.growthTimes.finalStage * (1 / crop.growthMultiplier);
        const progress = Math.min(elapsed / total, 1);

        const position = this.scene.grid.gridToIso(crop.x, crop.y);
        const barWidth = 32;
        const barHeight = 4;

        crop.progressBar.clear();
        
        // Background bar
        crop.progressBar.fillStyle(0x000000, 0.5);
        crop.progressBar.fillRect(
            this.scene.cameras.main.centerX + position.tileX - barWidth/2,
            this.scene.cameras.main.centerY + position.tileY - 40,
            barWidth,
            barHeight
        );
        
        // Progress bar
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
