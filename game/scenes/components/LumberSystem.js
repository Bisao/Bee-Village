
export default class LumberSystem {
    constructor(scene) {
        this.scene = scene;
        this.isWorking = false;
        this.currentTree = null;
        this.cuttingTime = 5000; // 5 segundos para cortar
        this.treeRespawnTime = 40000; // 40 segundos para reaparecer
        this.movementSpeed = 50;
        this.resources = {
            'wood': '🪵',
            'log': '🌳'
        };
    }

    startWorking(npc) {
        if (this.isWorking) return;
        this.isWorking = true;
        npc.config.emoji = '🔍';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
        this.workCycle(npc);
    }

    async workCycle(npc) {
        while (this.isWorking) {
            // 1. Procurar árvore disponível
            const tree = this.findNearestTree(npc);
            if (!tree) {
                console.log('Nenhuma árvore disponível');
                npc.config.emoji = '💤';
                npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                await this.waitFor(2000);
                continue;
            }

            // 2. Caminhar até a árvore
            await this.moveToTree(npc, tree);

            // 3. Cortar a árvore
            await this.cutTree(npc, tree);

            // 4. Caminhar até o silo
            const silo = this.findNearestSilo(npc);
            if (silo) {
                await this.moveToSilo(npc, silo);
                await this.depositResources(npc, silo);
            }
        }
    }

    findNearestTree(npc) {
        let nearestTree = null;
        let shortestDistance = Infinity;

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.type === 'tree' && !value.isCut) {
                const [x, y] = key.split(',').map(Number);
                const distance = Phaser.Math.Distance.Between(
                    npc.gridX, npc.gridY,
                    x, y
                );

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestTree = { gridX: x, gridY: y, sprite: value.sprite };
                }
            }
        }
        return nearestTree;
    }

    findNearestSilo(npc) {
        let nearestSilo = null;
        let shortestDistance = Infinity;

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.buildingType === 'silo') {
                const [x, y] = key.split(',').map(Number);
                const distance = Phaser.Math.Distance.Between(
                    npc.gridX, npc.gridY,
                    x, y
                );

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestSilo = { gridX: x, gridY: y, sprite: value.sprite };
                }
            }
        }
        return nearestSilo;
    }

    async moveToTree(npc, tree) {
        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
        const position = this.scene.grid.gridToIso(tree.gridX, tree.gridY);
        await this.moveNPC(npc, position.tileX, position.tileY);
        npc.gridX = tree.gridX;
        npc.gridY = tree.gridY;
    }

    async moveNPC(npc, targetX, targetY) {
        return new Promise(resolve => {
            const nameTextY = targetY - 64;
            
            this.scene.tweens.add({
                targets: [npc.sprite, npc.nameText],
                x: targetX,
                y: (target, key, value, targetIndex) => {
                    return targetIndex === 0 ? targetY - 32 : nameTextY;
                },
                duration: this.calculateMovementDuration(npc.sprite.x, npc.sprite.y, targetX, targetY),
                ease: 'Linear',
                onComplete: () => {
                    npc.sprite.setDepth(npc.gridY + 2);
                    npc.nameText.setDepth(npc.gridY + 3);
                    resolve();
                }
            });
        });
    }

    calculateMovementDuration(startX, startY, endX, endY) {
        const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        return (distance / this.movementSpeed) * 1000;
    }

    async cutTree(npc, tree) {
        npc.config.emoji = '🪓';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
        const cutParticles = this.scene.add.particles(0, 0, 'tile_grass', {
            x: tree.sprite.x,
            y: tree.sprite.y,
            speed: { min: 20, max: 50 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            quantity: 1,
            frequency: 200
        });

        await this.waitFor(this.cuttingTime);
        cutParticles.destroy();
        
        const key = `${tree.gridX},${tree.gridY}`;
        const treeData = this.scene.grid.buildingGrid[key];
        if (treeData) {
            treeData.isCut = true;
            treeData.sprite.setVisible(false);
            
            this.scene.time.delayedCall(this.treeRespawnTime, () => {
                if (treeData) {
                    treeData.isCut = false;
                    treeData.sprite.setVisible(true);
                }
            });
        }
        
        if (npc.addItemToStorage('wood')) {
            console.log(`[${npc.config.name}] Cortou madeira`);
        } else {
            console.log(`[${npc.config.name}] Inventário cheio!`);
        }
    }

    async moveToSilo(npc, silo) {
        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
        const position = this.scene.grid.gridToIso(silo.gridX, silo.gridY);
        await this.moveNPC(npc, position.tileX, position.tileY);
        npc.gridX = silo.gridX;
        npc.gridY = silo.gridY;
    }

    async depositResources(npc, silo) {
        npc.config.emoji = '📦';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
        // Atualizar recursos no silo
        const siloStorage = this.scene.siloStorage || {};
        siloStorage.wood = (siloStorage.wood || 0) + npc.storage.wood;
        this.scene.siloStorage = siloStorage;
        
        // Limpar inventário do NPC
        npc.storage.wood = 0;
        
        await this.waitFor(1000);
    }

    waitFor(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }

    stopWorking() {
        this.isWorking = false;
    }
}
