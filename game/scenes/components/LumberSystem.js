export default class LumberSystem {
    constructor(scene) {
        this.scene = scene;
        this.isWorking = false;
        this.currentTree = null;
        this.isProcessingTree = false;
        this.cuttingTime = 15000;
        this.treeRespawnTime = 60000;
        this.resources = {
            'wood': '🪵',
            'log': '🌳'
        };
    }

    startWorking(npc) {
        if (npc.config.profession !== 'Lumberjack') {
            console.log('NPC não é lenhador');
            return;
        }

        console.log('Iniciando trabalho de lenhador');
        if (!npc.leaveHouse()) {
            console.log('NPC não conseguiu sair da casa');
            return;
        }

        this.isWorking = true;
        npc.currentJob = 'lumber';
        npc.isAutonomous = false;

        this.workCycle(npc);
    }

    async workCycle(npc) {
        while (this.isWorking) {
            try {
                if (this.isProcessingTree) {
                    await this.waitFor(1000);
                    continue;
                }

                // 1. Procurar árvore disponível
                npc.config.emoji = '🔍';
                npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

                const tree = this.findNearestTree(npc);
                if (!tree) {
                    console.log('Nenhuma árvore disponível');
                    await this.waitFor(3000);
                    continue;
                }

                // 2. Mover até a árvore
                const canReach = await this.moveToTree(npc, tree);
                if (!canReach) {
                    console.log('Não foi possível alcançar a árvore');
                    await this.waitFor(1000);
                    continue;
                }

                // 3. Verificar se está no mesmo tile
                if (!this.isAdjacentToTree(npc, tree)) {
                    console.log('NPC não está adjacente à árvore');
                    continue;
                }

                // 4. Cortar a árvore
                this.isProcessingTree = true;
                await this.cutTree(npc, tree);
                this.isProcessingTree = false;

                // 5. Se tiver madeira, procurar silo
                if (npc.inventory.wood > 0) {
                    const silo = this.findNearestSilo(npc);
                    if (!silo) {
                        console.log('Nenhum silo encontrado');
                        await this.waitFor(1000);
                        continue;
                    }

                    // 6. Depositar recursos
                    await this.moveToSilo(npc, silo);
                    await this.depositResources(npc);
                }

            } catch (error) {
                console.error('Erro no ciclo de trabalho:', error);
                this.isProcessingTree = false;
                await this.waitFor(1000);
            }
        }
    }

    isAdjacentToTree(npc, tree) {
        const dx = Math.abs(npc.gridX - tree.gridX);
        const dy = Math.abs(npc.gridY - tree.gridY);
        return dx + dy === 1;
    }

    findNearestTree(npc) {
        let nearestTree = null;
        let shortestDistance = Infinity;

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value && value.type === 'tree' && value.sprite && !value.isCut && 
                ['tree_simple', 'tree_pine', 'tree_fruit'].includes(value.sprite.texture.key)) {
                const [x, y] = key.split(',').map(Number);
                const distance = Math.abs(npc.gridX - x) + Math.abs(npc.gridY - y);

                // Verificar se a árvore está alcançável
                const adjacentPositions = [
                    {x: x + 1, y: y}, {x: x - 1, y: y},
                    {x: x, y: y + 1}, {x: x, y: y - 1}
                ];

                const canReachTree = adjacentPositions.some(pos => 
                    this.scene.grid.isValidPosition(pos.x, pos.y) && 
                    !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]
                );

                if (canReachTree && distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestTree = { 
                        gridX: x, 
                        gridY: y, 
                        sprite: value.sprite,
                        key: key
                    };
                }
            }
        }

        return nearestTree;
    }

    async moveToTree(npc, tree) {
        if (!tree) return false;

        const path = this.findPathToTree(npc, tree);
        if (!path || path.length === 0) return false;

        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

        for (const pos of path) {
            if (!this.isWorking) return false;
            this.drawPathLine(npc, pos.x, pos.y);
            await npc.moveTo(pos.x, pos.y);
            await this.waitFor(200);
        }

        return true;
    }

    findPathToTree(npc, tree) {
        const visited = new Set();
        const queue = [{
            x: npc.gridX,
            y: npc.gridY,
            path: []
        }];

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            // Verifica se está adjacente à árvore
            if (Math.abs(current.x - tree.gridX) + Math.abs(current.y - tree.gridY) === 1) {
                return current.path;
            }

            // Adiciona movimentos possíveis
            const moves = [
                {dx: 0, dy: 1},  // baixo
                {dx: 1, dy: 0},  // direita
                {dx: 0, dy: -1}, // cima
                {dx: -1, dy: 0}  // esquerda
            ];

            for (const move of moves) {
                const newX = current.x + move.dx;
                const newY = current.y + move.dy;
                const newKey = `${newX},${newY}`;

                if (!visited.has(newKey) && 
                    this.scene.grid.isValidPosition(newX, newY) && 
                    !this.scene.grid.buildingGrid[newKey]) {
                    
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...current.path, {x: newX, y: newY}]
                    });
                }
            }
        }

        return null;
    }

    drawPathLine(npc, targetX, targetY) {
        if (this.pathGraphics) {
            this.pathGraphics.destroy();
        }

        this.pathGraphics = this.scene.add.graphics();
        this.pathGraphics.lineStyle(2, 0xffff00, 0.5);
        
        const startPos = this.scene.grid.gridToIso(npc.gridX, npc.gridY);
        const endPos = this.scene.grid.gridToIso(targetX, targetY);
        
        this.pathGraphics.beginPath();
        this.pathGraphics.moveTo(
            this.scene.cameras.main.centerX + startPos.tileX,
            this.scene.cameras.main.centerY + startPos.tileY
        );
        this.pathGraphics.lineTo(
            this.scene.cameras.main.centerX + endPos.tileX,
            this.scene.cameras.main.centerY + endPos.tileY
        );
        this.pathGraphics.strokePath();
        
        // Limpar linha após 1 segundo
        this.scene.time.delayedCall(1000, () => {
            if (this.pathGraphics) {
                this.pathGraphics.destroy();
                this.pathGraphics = null;
            }
        });
    }

    async cutTree(npc, tree) {
        if (!this.isAdjacentToTree(npc, tree)) return;

        npc.config.emoji = '🪓';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        console.log('Iniciando corte da árvore em:', tree.gridX, tree.gridY);

        // Efeito visual de corte
        const cutInterval = setInterval(() => {
            if (tree.sprite && tree.sprite.active) {
                const text = this.scene.add.text(tree.sprite.x, tree.sprite.y - 10, 'Toc', {
                    fontSize: '20px',
                    fill: '#fff',
                    stroke: '#000',
                    strokeThickness: 2
                }).setDepth(9999).setOrigin(0.5);

                this.scene.tweens.add({
                    targets: text,
                    y: text.y - 15,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => text.destroy()
                });
            }
        }, 2500);

        await this.waitFor(this.cuttingTime);
        clearInterval(cutInterval);

        const key = `${tree.gridX},${tree.gridY}`;
        const treeData = this.scene.grid.buildingGrid[key];
        if (treeData) {
            treeData.isCut = true;
            treeData.sprite.setVisible(false);

            if (npc.addItemToStorage('wood')) {
                console.log(`[${npc.config.name}] Cortou madeira`);
            }

            // Programar reaparecimento
            this.scene.time.delayedCall(this.treeRespawnTime, () => {
                if (treeData) {
                    treeData.isCut = false;
                    treeData.sprite.setVisible(true);
                }
            });
        }
    }

    async moveToSilo(npc, silo) {
        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

        const adjacentPositions = [
            {x: silo.gridX + 1, y: silo.gridY},
            {x: silo.gridX - 1, y: silo.gridY},
            {x: silo.gridX, y: silo.gridY + 1},
            {x: silo.gridX, y: silo.gridY - 1}
        ];

        for (const pos of adjacentPositions) {
            if (this.scene.grid.isValidPosition(pos.x, pos.y) && 
                !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]) {
                this.drawPathLine(npc, pos.x, pos.y);
                await npc.moveTo(pos.x, pos.y);
                return true;
            }
        }

        return false;
    }

    async depositResources(npc) {
        npc.config.emoji = '📦';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

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

    waitFor(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }

    stopWorking() {
        this.isWorking = false;
        this.isProcessingTree = false;
        if (this.pathGraphics) {
            this.pathGraphics.destroy();
            this.pathGraphics = null;
        }
    }
}