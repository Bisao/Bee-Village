
export default class LumberSystem {
    constructor(scene) {
        this.scene = scene;
        this.isWorking = false;
        this.currentTree = null;
        this.cuttingTime = 15000; // 15 segundos para cortar
        this.treeRespawnTime = 60000; // 60 segundos para reaparecer
        this.maxAttempts = 5; // Máximo de tentativas para encontrar árvore
        this.resources = {
            'wood': '🪵',
            'log': '🌳'
        };

        // Som de corte
        this.cutSound = {
            time: 0,
            interval: 1200 // Intervalo entre cada "Toc"
        };
    }

    startWorking(npc) {
        if (npc.config.profession !== 'Lumberjack') {
            console.log('NPC não é lenhador');
            return;
        }
        
        console.log('Iniciando trabalho de lenhador:', npc.config.name);
        if (!npc.leaveHouse()) {
            console.log('NPC não conseguiu sair da casa');
            return;
        }

        this.isWorking = true;
        npc.currentJob = 'lumber';
        npc.isAutonomous = false;
        
        // Inicia o ciclo de trabalho
        this.workCycle(npc);
    }

    async workCycle(npc) {
        try {
            if (this.hasCompletedCycle) {
                npc.returnHome();
                this.stopWorking();
                return;
            }

            console.log('Iniciando ciclo de trabalho do lenhador');
            
            // 1. Encontrar árvore mais próxima
            const tree = this.findNearestTree(npc);
            if (!tree) {
                console.log('Nenhuma árvore disponível');
                npc.returnHome();
                this.stopWorking();
                return;
            }

            // 2. Ir até o tile da árvore
            const tileAdjacente = {
                x: tree.gridX + 1,
                y: tree.gridY
            };
            await npc.moveTo(tileAdjacente.x, tileAdjacente.y);
            
            // 3. Cortar a árvore
            await this.cutTree(npc, tree);

            // 4. Ir até o silo
            const silo = this.findNearestSilo(npc);
            if (silo) {
                const siloTile = {
                    x: silo.gridX + 1,
                    y: silo.gridY
                };
                await npc.moveTo(siloTile.x, siloTile.y);
                await this.depositResources(npc);
            }

            // Marcar ciclo como completo
            this.hasCompletedCycle = true;
            
            // 5. Retornar para casa
            npc.returnHome();
            this.stopWorking();

        } catch (error) {
            console.error('Erro no ciclo de trabalho:', error);
            npc.returnHome();
            this.stopWorking();
        }
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
                    console.log('Árvore alcançável encontrada:', value.sprite.texture.key, 'em:', x, y);
                }
            }
        }

        return nearestTree;
    }

    validateTreePosition(tree) {
        // Validar se está dentro dos limites do mapa
        if (!this.scene.grid.isValidPosition(tree.gridX, tree.gridY)) {
            return false;
        }

        // Validar se posição não está ocupada por outra estrutura
        const key = `${tree.gridX},${tree.gridY}`;
        const tile = this.scene.grid.buildingGrid[key];
        return tile && tile.type === 'tree' && !tile.isCut;
    }

    async moveToTree(npc, tree) {
        if (!tree || !this.scene.grid.isValidPosition(tree.gridX, tree.gridY)) {
            console.log('Árvore inválida ou fora dos limites');
            return false;
        }

        const currentDistance = Math.abs(npc.gridX - tree.gridX) + Math.abs(npc.gridY - tree.gridY);
        if (currentDistance <= 1) {
            return true;
        }

        // Encontrar caminho até a árvore usando um padrão mais natural
        const path = this.findPathToTree(npc, tree);
        if (!path || path.length === 0) {
            console.log('Não foi possível encontrar caminho até a árvore');
            return false;
        }

        // Mover através do caminho
        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

        for (let i = 0; i < path.length; i++) {
            const pos = path[i];
            
            // Pequena pausa aleatória entre movimentos para parecer mais natural
            if (i > 0) {
                await this.waitFor(Math.random() * 200 + 100);
            }

            this.drawPathLine(npc, pos.x, pos.y);
            await npc.moveTo(pos.x, pos.y);

            // Verificar se ainda está trabalhando
            if (!this.isWorking) {
                return false;
            }
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
        if (!tree || !tree.sprite || !tree.key) {
            console.log('Árvore inválida para corte');
            return;
        }

        // Walk to tree first
        const tileNextToTree = {
            x: tree.gridX + 1,
            y: tree.gridY
        };
        
        await npc.moveTo(tileNextToTree.x, tileNextToTree.y);
        
        // Start cutting after reaching the tree
        npc.config.emoji = '🪓';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        console.log('Iniciando corte da árvore em:', tree.gridX, tree.gridY);

        // Som de corte "Toc"
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
                    duration: 500,
                    onComplete: () => text.destroy()
                });
            }
        }, 2000); // Intervalo maior entre cada "Toc"

        await this.waitFor(this.cuttingTime);
        
        clearInterval(cutInterval);
        
        const key = `${tree.gridX},${tree.gridY}`;
        const treeData = this.scene.grid.buildingGrid[key];
        
        if (treeData) {
            clearInterval(cutInterval); // Clear the Toc sound immediately when tree is cut
            treeData.isCut = true;
            treeData.sprite.setVisible(false);
            
            // Programar reaparecimento
            this.scene.time.delayedCall(this.treeRespawnTime, () => {
                if (treeData) {
                    treeData.isCut = false;
                    treeData.sprite.setVisible(true);
                }
            });

            if (npc.addItemToStorage('wood')) {
                console.log(`[${npc.config.name}] Cortou madeira`);
            } else {
                console.log(`[${npc.config.name}] Inventário cheio!`);
            }
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
        
        console.log('Depositando recursos no silo...');
        
        // Depositar madeira no silo
        if (npc.inventory.wood > 0) {
            console.log(`Depositando ${npc.inventory.wood} madeiras`);
            
            

            // Atualizar inventário
            npc.inventory.wood = 0;
            
            // Mostrar texto flutuante
            const text = this.scene.add.text(
                npc.sprite.x,
                npc.sprite.y - 40,
                '+ Madeira depositada!',
                { fontSize: '16px', fill: '#00ff00' }
            );
            
            this.scene.tweens.add({
                targets: text,
                y: text.y - 30,
                alpha: 0,
                duration: 1000,
                onComplete: () => text.destroy()
            });
            
            await this.waitFor(1000);
        }
        
        // Resetar emoji e continuar ciclo
        npc.config.emoji = '🔍';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
    }

    waitFor(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }

    stopWorking() {
        this.isWorking = false;
        if (this.pathGraphics) {
            this.pathGraphics.destroy();
            this.pathGraphics = null;
        }
    }
}
