
export default class LumberSystem {
    constructor(scene) {
        this.scene = scene;
        this.isWorking = false;
        this.currentTree = null;
        this.cuttingTime = 5000; // 5 segundos para cortar
        this.treeRespawnTime = 40000; // 40 segundos para reaparecer
        this.maxAttempts = 5; // Máximo de tentativas para encontrar árvore
        this.resources = {
            'wood': '🪵',
            'log': '🌳'
        };

        // Som de corte
        this.cutSound = {
            time: 0,
            interval: 800 // Intervalo entre cada "Toc"
        };
    }

    startWorking(npc) {
        if (this.isWorking) {
            console.log('Já está trabalhando');
            return;
        }
        
        if (npc.config.profession !== 'Lumberjack') {
            console.log('NPC não é lenhador');
            return;
        }
        
        console.log('Iniciando trabalho de lenhador');
        this.isWorking = true;
        npc.currentJob = 'lumber';
        npc.config.emoji = '🔍';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        this.workCycle(npc);
    }

    async workCycle(npc) {
        while (this.isWorking) {
            try {
                console.log('Iniciando ciclo de trabalho do lenhador');
                
                // 1. Procurar árvore disponível
                const tree = this.findNearestTree(npc);
                if (!tree) {
                    console.log('Nenhuma árvore disponível');
                    await this.waitFor(2000);
                    continue;
                }
                console.log('Árvore encontrada em:', tree.gridX, tree.gridY);

                // 2. Validar posição da árvore
                if (!this.validateTreePosition(tree)) {
                    console.log('Árvore em posição inválida');
                    await this.waitFor(1000);
                    continue;
                }

                // 3. Tentar se aproximar da árvore
                console.log('Indo até a árvore...');
                const canReach = await this.moveToTree(npc, tree);
                if (!canReach) {
                    console.log('Não foi possível alcançar a árvore, tentando outra...');
                    await this.waitFor(1000);
                    continue;
                }

                // 4. Cortar a árvore
                await this.cutTree(npc, tree);

                // 5. Procurar silo mais próximo
                const silo = this.findNearestSilo(npc);
                if (!silo) {
                    console.log('Nenhum silo encontrado');
                    await this.waitFor(1000);
                    continue;
                }

                // 6. Depositar recursos
                await this.moveToSilo(npc, silo);
                await this.depositResources(npc, silo);

            } catch (error) {
                console.error('Erro no ciclo de trabalho:', error);
                await this.waitFor(1000);
            }
        }
    }

    findNearestTree(npc) {
        let nearestTree = null;
        let shortestDistance = Infinity;
        const treeTypes = ['tree_simple', 'tree_pine', 'tree_fruit', 'tree_autumn'];

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value && value.sprite && 
                treeTypes.some(type => value.sprite.texture.key === type) && 
                !value.isCut) {
                
                const [x, y] = key.split(',').map(Number);
                const distance = Math.abs(npc.gridX - x) + Math.abs(npc.gridY - y);

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestTree = { 
                        gridX: x, 
                        gridY: y, 
                        sprite: value.sprite,
                        key: key
                    };
                    console.log('Árvore encontrada:', value.sprite.texture.key, 'em:', x, y);
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
        // Validar se a árvore existe e está dentro dos limites
        if (!tree || !this.scene.grid.isValidPosition(tree.gridX, tree.gridY)) {
            console.log('Árvore inválida ou fora dos limites');
            return false;
        }

        // Calcular distância atual
        const currentDistance = Math.abs(npc.gridX - tree.gridX) + Math.abs(npc.gridY - tree.gridY);
        if (currentDistance <= 1) {
            return true; // Já está adjacente à árvore
        }

        // Encontrar melhor posição adjacente
        const adjacentPositions = [
            {x: tree.gridX + 1, y: tree.gridY},
            {x: tree.gridX - 1, y: tree.gridY},
            {x: tree.gridX, y: tree.gridY + 1},
            {x: tree.gridX, y: tree.gridY - 1}
        ].filter(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]
        );

        if (adjacentPositions.length === 0) {
            console.log('Nenhuma posição adjacente disponível');
            return false;
        }

        // Escolher a posição mais próxima
        const bestPosition = adjacentPositions.reduce((best, pos) => {
            const distance = Math.abs(npc.gridX - pos.x) + Math.abs(npc.gridY - pos.y);
            return (!best || distance < best.distance) ? {...pos, distance} : best;
        }, null);

        if (bestPosition) {
            npc.config.emoji = '🚶';
            npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
            this.drawPathLine(npc, bestPosition.x, bestPosition.y);
            await npc.moveTo(bestPosition.x, bestPosition.y);
            return true;
        }

        return false;
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

        npc.config.emoji = '🪓';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        console.log('Iniciando corte da árvore em:', tree.gridX, tree.gridY);
        
        // Efeito de partículas
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

        // Som de corte "Toc"
        const cutInterval = setInterval(() => {
            const text = this.scene.add.text(tree.sprite.x, tree.sprite.y - 20, 'Toc', {
                fontSize: '16px',
                fill: '#fff'
            });
            
            this.scene.tweens.add({
                targets: text,
                y: text.y - 30,
                alpha: 0,
                duration: 1000,
                onComplete: () => text.destroy()
            });
        }, this.cutSound.interval);

        await this.waitFor(this.cuttingTime);
        
        clearInterval(cutInterval);
        cutParticles.destroy();
        
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
            
            // Efeito visual de depósito
            const depositParticles = this.scene.add.particles(0, 0, 'tile_grass', {
                x: npc.sprite.x,
                y: npc.sprite.y,
                speed: { min: 10, max: 30 },
                scale: { start: 0.2, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 800,
                blendMode: 'ADD',
                quantity: 1
            });

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
            depositParticles.destroy();
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
