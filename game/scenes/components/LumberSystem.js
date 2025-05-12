export default class LumberSystem {
    constructor(scene) {
        this.scene = scene;
        this.state = {
            isWorking: false,
            isProcessingTree: false
        };

        this.config = {
            cuttingTime: 15000,        // 15 segundos para cortar
            respawnTime: 60000,        // 1 minuto para reaparecer
            searchRadius: 10,          // Raio de busca para árvores
            maxInventory: 5           // Capacidade máxima de madeira
        };

        this.resources = {
            wood: '🪵',
            log: '🌳'
        };
    }

    startWorking(npc) {
        if (!this.validateNPC(npc)) return;

        if (!npc.leaveHouse()) {
            console.log('[LumberSystem] NPC não conseguiu sair da casa');
            return;
        }

        this.state.isWorking = true;
        npc.currentJob = 'lumber';
        npc.isAutonomous = true;

        this.workCycle(npc);
    }

    validateNPC(npc) {
        if (!npc || npc.config.profession !== 'Lumberjack') {
            console.log('[LumberSystem] NPC inválido ou não é lenhador');
            return false;
        }
        return true;
    }

    async workCycle(npc) {
        while (this.state.isWorking) {
            try {
                if (npc.currentJob === 'rest') {
                    this.stopWorking();
                    return;
                }

                if (this.state.isProcessingTree) {
                    await this.waitFor(1000);
                    continue;
                }

                const tree = await this.findAndProcessTree(npc);
                if (!tree) {
                    await this.waitFor(3000);
                    continue;
                }

                if (npc.inventory.wood >= this.config.maxInventory) {
                    await this.depositWood(npc);
                }

            } catch (error) {
                console.error('[LumberSystem] Erro no ciclo:', error);
                await this.waitFor(1000);
            }
        }
    }

    async findAndProcessTree(npc) {
        // 1. Procurar árvore
        this.updateNPCStatus(npc, '🔍', 'Procurando');
        const tree = this.findNearestTree(npc);

        if (!tree) {
            console.log('[LumberSystem] Nenhuma árvore disponível');
            return null;
        }

        // 2. Mover até a árvore
        this.updateNPCStatus(npc, '🚶', 'Movendo');
        const reached = await this.moveToTree(npc, tree);

        if (!reached) {
            console.log('[LumberSystem] Não alcançou a árvore');
            return null;
        }

        // 3. Cortar a árvore
        if (this.isAdjacentToTree(npc, tree)) {
            await this.cutTree(npc, tree);
            return tree;
        }

        return null;
    }

    findNearestTree(npc) {
        let nearestTree = null;
        let shortestDistance = Infinity;

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (this.isValidTree(value)) {
                const [treeX, treeY] = key.split(',').map(Number);
                const distance = Math.abs(npc.gridX - treeX) + Math.abs(npc.gridY - treeY);

                if (distance < shortestDistance) {
                    const adjacentPos = this.findBestAdjacentPosition(treeX, treeY);
                    if (adjacentPos) {
                        shortestDistance = distance;
                        nearestTree = {
                            gridX: treeX,
                            gridY: treeY,
                            targetX: adjacentPos.x,
                            targetY: adjacentPos.y,
                            sprite: value.sprite,
                            key: key
                        };
                    }
                }
            }
        }

        return nearestTree;
    }

    isValidTree(tile) {
        return tile && 
               tile.type === 'tree' && 
               tile.sprite && 
               !tile.isCut && 
               ['tree_simple', 'tree_pine', 'tree_fruit'].includes(tile.sprite.texture.key);
    }

    findBestAdjacentPosition(treeX, treeY) {
        const positions = [
            {x: treeX + 1, y: treeY},
            {x: treeX - 1, y: treeY},
            {x: treeX, y: treeY + 1},
            {x: treeX, y: treeY - 1}
        ];

        return positions.find(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]
        );
    }

    async moveToTree(npc, tree) {
        if (!tree) return false;
        
        const adjacentPos = this.findBestAdjacentPosition(tree.gridX, tree.gridY);
        if (!adjacentPos) return false;

        await npc.moveTo(adjacentPos.x, adjacentPos.y);
        return this.isAdjacentToTree(npc, tree);
    }

    isAdjacentToTree(npc, tree) {
        const dx = Math.abs(npc.gridX - tree.gridX);
        const dy = Math.abs(npc.gridY - tree.gridY);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    findBestAdjacentPosition(treeX, treeY) {
        const positions = [
            {x: treeX + 1, y: treeY},
            {x: treeX - 1, y: treeY},
            {x: treeX, y: treeY + 1},
            {x: treeX, y: treeY - 1}
        ];

        return positions.find(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]
        ) || positions[0];
    }

    async cutTree(npc, tree) {
        if (!this.isAdjacentToTree(npc, tree)) return;

        this.state.isProcessingTree = true;
        this.updateNPCStatus(npc, '🪓', 'Cortando');

        const cutEffect = this.createCutEffect(tree);
        await this.waitFor(this.config.cuttingTime);
        clearInterval(cutEffect);

        await this.processTreeCut(npc, tree);
        this.state.isProcessingTree = false;
    }

    createCutEffect(tree) {
        return setInterval(() => {
            if (tree.sprite?.active) {
                const text = this.scene.add.text(
                    tree.sprite.x, 
                    tree.sprite.y - 10,
                    'Toc', 
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
            }
        }, 2500);
    }

    async processTreeCut(npc, tree) {
        const treeData = this.scene.grid.buildingGrid[tree.key];
        if (!treeData) return;

        treeData.isCut = true;
        treeData.sprite.setVisible(false);

        if (npc.addItemToStorage('wood')) {
            this.showResourceGain(npc);
        }

        this.scheduleTreeRespawn(treeData);
    }

    showResourceGain(npc) {
        const text = this.scene.add.text(
            npc.sprite.x,
            npc.sprite.y - 40,
            `+1 ${this.resources.wood}`,
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

    scheduleTreeRespawn(treeData) {
        this.scene.time.delayedCall(this.config.respawnTime, () => {
            if (treeData) {
                treeData.isCut = false;
                treeData.sprite.setVisible(true);
            }
        });
    }

    async depositWood(npc) {
        const silo = this.findNearestSilo(npc);
        if (!silo) {
            console.log('[LumberSystem] Nenhum silo encontrado');
            return;
        }

        this.updateNPCStatus(npc, '🚶', 'Indo ao silo');
        const reached = await this.moveToSilo(npc, silo);

        if (reached) {
            this.updateNPCStatus(npc, '📦', 'Depositando');
            await this.depositResources(npc);
        }
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

    async depositResources(npc) {
        await this.waitFor(3000);

        if (npc.inventory.wood > 0) {
            const amount = npc.inventory.wood;
            npc.inventory.wood = 0;

            const text = this.scene.add.text(
                npc.sprite.x,
                npc.sprite.y - 40,
                `+ ${amount} Madeira depositada!`,
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
    }

    updateNPCStatus(npc, emoji, status) {
        npc.config.emoji = emoji;
        npc.nameText.setText(`${emoji} ${npc.config.name}`);
        console.log(`[LumberSystem] ${npc.config.name}: ${status}`);
    }

    waitFor(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }

    stopWorking() {
        this.state.isWorking = false;
        this.state.isProcessingTree = false;
    }
}