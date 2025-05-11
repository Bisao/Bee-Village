export default class LumberSystem {
    constructor(scene) {
        this.scene = scene;
        this.isWorking = false;
        this.currentTree = null;
        this.isProcessingTree = false;
        this.cuttingTime = 15000;
        this.treeRespawnTime = 300000;
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
        npc.isAutonomous = true;

        this.workCycle(npc);
    }

    async workCycle(npc) {
        while (this.isWorking) {
            try {
                // Verifica se está em modo descanso
                if (npc.currentJob === 'rest') {
                    this.stopWorking();
                    return;
                }

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
        let bestAdjacentPosition = null;

        // Procura por todas as árvores no grid
        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value && value.type === 'tree' && value.sprite && !value.isCut && 
                ['tree_simple', 'tree_pine', 'tree_fruit'].includes(value.sprite.texture.key)) {
                const [treeX, treeY] = key.split(',').map(Number);
                
                // Posições adjacentes à árvore
                const adjacentPositions = [
                    {x: treeX + 1, y: treeY},
                    {x: treeX - 1, y: treeY},
                    {x: treeX, y: treeY + 1},
                    {x: treeX, y: treeY - 1}
                ];

                // Verifica cada posição adjacente
                for (const pos of adjacentPositions) {
                    if (this.scene.grid.isValidPosition(pos.x, pos.y)) {
                        const key = `${pos.x},${pos.y}`;
                        const tile = this.scene.grid.buildingGrid[key];
                        
                        // Verifica se o tile está livre de construções e outros objetos
                        if (!tile || (tile.type !== 'building' && tile.type !== 'tree' && tile.type !== 'rock')) {
                        
                        // Calcula distância Manhattan da posição atual do NPC até a posição adjacente
                        const distance = Math.abs(npc.gridX - pos.x) + Math.abs(npc.gridY - pos.y);
                        
                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            nearestTree = { 
                                gridX: treeX, 
                                gridY: treeY, 
                                sprite: value.sprite,
                                key: key
                            };
                            bestAdjacentPosition = pos;
                        }
                    }
                }
            }
        }

        if (nearestTree) {
            nearestTree.targetX = bestAdjacentPosition.x;
            nearestTree.targetY = bestAdjacentPosition.y;
        }

        return nearestTree;
    }

    async moveToTree(npc, tree) {
        if (!tree || !tree.targetX || !tree.targetY) return false;

        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

        // Tenta encontrar um caminho até a árvore
        const path = this.findPathToTree(npc, tree);
        if (!path) {
            console.log('Não foi possível encontrar caminho até a árvore');
            return false;
        }

        // Move através do caminho encontrado
        for (const pos of path) {
            await npc.moveTo(pos.x, pos.y);
            if (npc.isMoving) {
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (!npc.isMoving) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
            }
        }

        // Move para a posição final adjacente à árvore
        await npc.moveTo(tree.targetX, tree.targetY);
        
        return this.isAdjacentToTree(npc, tree);
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
                }).setDepth(5).setOrigin(0.5);

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