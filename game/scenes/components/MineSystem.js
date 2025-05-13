
export default class MineSystem {
    constructor(scene) {
        this.scene = scene;
        this.state = {
            isWorking: false,
            isProcessingRock: false
        };

        this.config = {
            miningTime: 20000,
            respawnTime: 120000,
            searchRadius: 10,
            maxInventory: 4
        };

        this.resources = {
            ore: '⛏️',
            rock: '🪨'
        };
    }

    startWorking(npc) {
        if (!this.validateNPC(npc)) return;
        if (!npc.leaveHouse()) {
            console.log('[MineSystem] NPC não conseguiu sair da casa');
            return;
        }

        this.state.isWorking = true;
        npc.currentJob = 'miner';
        npc.isAutonomous = true;
        this.workCycle(npc);
    }

    async workCycle(npc) {
        while (this.state.isWorking) {
            try {
                if (npc.currentJob === 'rest') {
                    this.stopWorking();
                    return;
                }

                if (this.state.isProcessingRock) {
                    await this.waitFor(1000);
                    continue;
                }

                const rock = await this.findAndProcessRock(npc);
                if (!rock) {
                    await this.waitFor(3000);
                    continue;
                }

                if (npc.inventory.ore >= this.config.maxInventory) {
                    await this.depositOre(npc);
                }
            } catch (error) {
                console.error('[MineSystem] Erro no ciclo:', error);
                await this.waitFor(1000);
            }
        }
    }

    stopWorking() {
        this.state.isWorking = false;
        this.state.isProcessingRock = false;
    }

    async findAndProcessRock(npc) {
        this.updateNPCStatus(npc, '🔍', 'Procurando');
        const rock = this.findNearestRock(npc);
        if (!rock) return null;

        this.updateNPCStatus(npc, '🚶', 'Movendo');
        const reached = await this.moveToRock(npc, rock);
        if (!reached) return null;

        if (this.isAdjacentToRock(npc, rock)) {
            await this.mineRock(npc, rock);
            return rock;
        }
        return null;
    }

    findNearestRock(npc) {
        let nearestRock = null;
        let shortestDistance = Infinity;

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (!this.isValidRock(value)) continue;

            const [rockX, rockY] = key.split(',').map(Number);
            const distance = Math.abs(npc.gridX - rockX) + Math.abs(npc.gridY - rockY);

            if (distance < shortestDistance) {
                const adjacentPos = this.findBestAdjacentPosition(rockX, rockY);
                if (adjacentPos) {
                    shortestDistance = distance;
                    nearestRock = {
                        gridX: rockX,
                        gridY: rockY,
                        targetX: adjacentPos.x,
                        targetY: adjacentPos.y,
                        sprite: value.sprite,
                        key: key
                    };
                }
            }
        }
        return nearestRock;
    }

    async mineRock(npc, rock) {
        if (!this.isAdjacentToRock(npc, rock)) {
            console.log('[MineSystem] NPC muito longe da rocha');
            return false;
        }

        this.state.isProcessingRock = true;
        this.updateNPCStatus(npc, '⛏️', 'Minerando');

        const mineEffect = this.createMineEffect(rock);
        await this.waitFor(this.config.miningTime);
        clearInterval(mineEffect);

        const success = await this.processRockMining(npc, rock);
        this.state.isProcessingRock = false;
        return success;
    }

    async depositOre(npc) {
        const silo = this.findNearestSilo(npc);
        if (!silo) {
            console.log('[MineSystem] Nenhum silo encontrado');
            return;
        }

        this.updateNPCStatus(npc, '🚶', 'Indo ao silo');
        const reached = await this.moveToSilo(npc, silo);

        if (reached) {
            this.updateNPCStatus(npc, '📦', 'Depositando');
            await this.depositResources(npc);
        }
    }

    async depositResources(npc) {
        await this.waitFor(3000);
        if (npc.inventory.ore > 0) {
            const amount = npc.inventory.ore;
            const silo = this.findNearestSilo(npc);
            
            if (silo && this.scene.resourceSystem.depositResource(silo.gridX, silo.gridY, 'ore', amount)) {
                npc.inventory.ore = 0;
                this.showResourceGain(npc, `+ ${amount} Minério depositado!`);
                this.updateInventoryUI(npc);
            } else {
                this.showResourceGain(npc, 'Silo cheio!');
            }
        }
    }

    isValidRock(tile) {
        return tile && 
               tile.type === 'rock' && 
               tile.sprite && 
               !tile.isMined && 
               ['big_rock', 'small_rock'].includes(tile.sprite.texture.key);
    }

    validateNPC(npc) {
        return npc && npc.config.profession === 'Miner';
    }

    isAdjacentToRock(npc, rock) {
        const dx = Math.abs(npc.gridX - rock.gridX);
        const dy = Math.abs(npc.gridY - rock.gridY);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    findBestAdjacentPosition(rockX, rockY) {
        const positions = [
            {x: rockX + 1, y: rockY},
            {x: rockX - 1, y: rockY},
            {x: rockX, y: rockY + 1},
            {x: rockX, y: rockY - 1}
        ];

        return positions.find(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]
        );
    }

    createMineEffect(rock) {
        return setInterval(() => {
            if (!rock.sprite?.active) return;

            const text = this.scene.add.text(
                rock.sprite.x, 
                rock.sprite.y - 10,
                'Tink', 
                {
                    fontSize: '20px',
                    fill: '#fff',
                    stroke: '#000',
                    strokeThickness: 2
                }
            ).setDepth(5).setOrigin(0.5);

            this.scene.tweens.add({
                targets: text,
                y: text.y - 15,
                alpha: 0,
                duration: 800,
                onComplete: () => text.destroy()
            });

            this.scene.tweens.add({
                targets: rock.sprite,
                scaleX: { from: 0.95, to: 1 },
                scaleY: { from: 0.95, to: 1 },
                duration: 100,
                ease: 'Sine.easeInOut'
            });
        }, 2500);
    }

    showResourceGain(npc, message) {
        const text = this.scene.add.text(
            npc.sprite.x,
            npc.sprite.y - 40,
            message,
            { fontSize: '16px', fill: '#00ff00' }
        );

        this.scene.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    updateNPCStatus(npc, emoji, status) {
        npc.config.emoji = emoji;
        npc.nameText.setText(`${emoji} ${npc.config.name}`);
        console.log(`[MineSystem] ${npc.config.name}: ${status}`);
    }

    updateInventoryUI(npc) {
        const controlPanel = document.querySelector('.npc-modal');
        if (controlPanel && controlPanel.dataset.npcId === npc.id) {
            const storageSlots = controlPanel.querySelectorAll('.storage-slot');
            const oreCount = npc.inventory.ore;

            storageSlots.forEach((slot, index) => {
                const hasOre = index < oreCount;
                slot.querySelector('.storage-amount').textContent = hasOre ? '1/1' : '0/1';
            });
        }
    }

    waitFor(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }

    async moveToRock(npc, rock) {
        if (!rock) return false;

        const adjacentPos = this.findBestAdjacentPosition(rock.gridX, rock.gridY);
        if (!adjacentPos) return false;

        await npc.moveTo(adjacentPos.x, adjacentPos.y);
        return this.isAdjacentToRock(npc, rock);
    }

    findNearestSilo(npc) {
        let nearestSilo = null;
        let shortestDistance = Infinity;

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.buildingType === 'silo') {
                const [x, y] = key.split(',').map(Number);
                const distance = Math.abs(npc.gridX - x) + Math.abs(npc.gridY - y);

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestSilo = { gridX: x, gridY: y, sprite: value.sprite };
                }
            }
        }

        return nearestSilo;
    }

    async moveToSilo(npc, silo) {
        const adjacentPosition = this.findBestAdjacentPosition(silo.gridX, silo.gridY);
        if (!adjacentPosition) return false;

        await npc.moveTo(adjacentPosition.x, adjacentPosition.y);
        return true;
    }

    async processRockMining(npc, rock) {
        const rockData = this.scene.grid.buildingGrid[rock.key];
        if (!rockData) return false;

        if (!npc.hasInventorySpace('ore')) {
            this.showResourceGain(npc, 'Inventário cheio!');
            return false;
        }

        rockData.isMined = true;
        rockData.sprite.setVisible(false);

        if (npc.addItemToStorage('ore')) {
            this.showResourceGain(npc, '+1 ' + this.resources.ore);
            this.updateInventoryUI(npc);
            this.scheduleRockRespawn(rockData);
            return true;
        }

        return false;
    }

    scheduleRockRespawn(rockData) {
        this.scene.time.delayedCall(this.config.respawnTime, () => {
            if (rockData) {
                rockData.isMined = false;
                rockData.sprite.setVisible(true);
            }
        });
    }
}
