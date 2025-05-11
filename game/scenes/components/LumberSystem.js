
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
        if (this.isWorking) return;
        this.isWorking = true;
        npc.config.emoji = '🔍';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        this.workCycle(npc);
    }

    async workCycle(npc) {
        while (this.isWorking) {
            try {
                // 1. Procurar árvore disponível
                const tree = await this.findNearestTree(npc);
                if (!tree) {
                    console.log('Nenhuma árvore disponível');
                    await this.waitFor(2000);
                    continue;
                }

                // 2. Validar posição da árvore
                if (!this.validateTreePosition(tree)) {
                    console.log('Árvore em posição inválida');
                    await this.waitFor(1000);
                    continue;
                }

                // 3. Tentar se aproximar da árvore
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

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.type === 'tree' && !value.isCut) {
                const [x, y] = key.split(',').map(Number);
                const distance = Math.abs(npc.gridX - x) + Math.abs(npc.gridY - y);

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestTree = { gridX: x, gridY: y, sprite: value.sprite };
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
        // Encontrar posição adjacente livre
        const adjacentPositions = [
            {x: tree.gridX + 1, y: tree.gridY},
            {x: tree.gridX - 1, y: tree.gridY},
            {x: tree.gridX, y: tree.gridY + 1},
            {x: tree.gridX, y: tree.gridY - 1}
        ];

        for (const pos of adjacentPositions) {
            if (this.scene.grid.isValidPosition(pos.x, pos.y) && 
                !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]) {
                
                npc.config.emoji = '🚶';
                npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                
                // Desenhar linha de movimento
                this.drawPathLine(npc, pos.x, pos.y);
                
                await npc.moveTo(pos.x, pos.y);
                return true;
            }
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
        npc.config.emoji = '🪓';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
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
        await this.waitFor(1000);
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
