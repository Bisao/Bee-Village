
export default class LumberSystem {
    constructor(scene) {
        this.scene = scene;
        this.isWorking = false;
        this.currentTree = null;
        this.cuttingTime = 5000; // 5 segundos para cortar
        this.treeRespawnTime = 40000; // 40 segundos para reaparecer
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
                await this.depositResources(npc);
            }
        }
    }

    findNearestTree(npc) {
        // Procura no buildingGrid por árvores
        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.type === 'tree' && !value.isCut) {
                const [x, y] = key.split(',').map(Number);
                return { gridX: x, gridY: y, sprite: value.sprite };
            }
        }
        return null;
    }

    findNearestSilo(npc) {
        // Procura no buildingGrid por silos
        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.buildingType === 'silo') {
                const [x, y] = key.split(',').map(Number);
                return { gridX: x, gridY: y, sprite: value.sprite };
            }
        }
        return null;
    }

    async moveToTree(npc, tree) {
        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        // Implementar movimento até a árvore
        await this.waitFor(1000);
    }

    async cutTree(npc, tree) {
        npc.config.emoji = '🪓';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
        // Efeito de partículas durante o corte
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
        
        // Remover árvore temporariamente
        const key = `${tree.gridX},${tree.gridY}`;
        const treeData = this.scene.grid.buildingGrid[key];
        if (treeData) {
            treeData.isCut = true;
            treeData.sprite.setVisible(false);
            
            // Programar reaparecimento
            this.scene.time.delayedCall(this.treeRespawnTime, () => {
                if (treeData) {
                    treeData.isCut = false;
                    treeData.sprite.setVisible(true);
                }
            });
        }
        
        // Adicionar madeira ao inventário do NPC
        if (npc.addItemToStorage('wood')) {
            console.log(`[${npc.config.name}] Cortou madeira`);
        } else {
            console.log(`[${npc.config.name}] Inventário cheio!`);
        }
    }

    async moveToSilo(npc, silo) {
        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        // Implementar movimento até o silo
        await this.waitFor(1000);
    }

    async depositResources(npc) {
        npc.config.emoji = '📦';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        // Implementar depósito de recursos no silo
        await this.waitFor(1000);
    }

    waitFor(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }

    stopWorking() {
        this.isWorking = false;
    }
}
