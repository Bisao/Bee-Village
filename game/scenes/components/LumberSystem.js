
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
            try {
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
                const moveSuccess = await this.moveToTree(npc, tree);
                if (!moveSuccess) {
                    console.log('Não foi possível alcançar a árvore, tentando outra...');
                    await this.waitFor(1000);
                    continue;
                }

                // 3. Cortar a árvore
                await this.cutTree(npc, tree);

                // 4. Caminhar até o silo
                const silo = this.findNearestSilo(npc);
                if (silo) {
                    await this.moveToSilo(npc, silo);
                    await this.depositResources(npc, silo);
                }
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
            if (value && value.type === 'tree' && !value.isCut && value.sprite && value.sprite.visible) {
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
        if (!tree || !tree.sprite || !tree.sprite.visible) {
            console.log('Árvore inválida, procurando outra...');
            return false;
        }

        // Validar se a árvore está dentro dos limites do mapa
        if (!this.scene.grid.isValidPosition(tree.gridX, tree.gridY)) {
            console.log('Árvore fora dos limites do mapa');
            return false;
        }

        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
        // Encontrar posições possíveis ao redor da árvore com prioridade
        const adjacentPositions = [
            {x: tree.gridX + 1, y: tree.gridY, priority: 1},
            {x: tree.gridX - 1, y: tree.gridY, priority: 1},
            {x: tree.gridX, y: tree.gridY + 1, priority: 1},
            {x: tree.gridX, y: tree.gridY - 1, priority: 1}
        ].filter(pos => {
            const isValid = this.scene.grid.isValidPosition(pos.x, pos.y);
            const isNotOccupied = !this.scene.isTileOccupied(pos.x, pos.y);
            const hasNoOtherNPC = !this.isPositionOccupiedByNPC(pos.x, pos.y);
            return isValid && isNotOccupied && hasNoOtherNPC;
        }).sort((a, b) => {
            // Ordenar por prioridade e depois por distância
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            const distA = Phaser.Math.Distance.Between(npc.gridX, npc.gridY, a.x, a.y);
            const distB = Phaser.Math.Distance.Between(npc.gridX, npc.gridY, b.x, b.y);
            return distA - distB;
        });

        if (adjacentPositions.length === 0) {
            console.log('Nenhuma posição válida encontrada próxima à árvore');
            return false;
        }

        // Encontrar posição mais próxima do NPC
        const validPosition = adjacentPositions.reduce((closest, pos) => {
            const distance = Phaser.Math.Distance.Between(
                npc.gridX, npc.gridY,
                pos.x, pos.y
            );
            return (!closest || distance < closest.distance) 
                ? {pos, distance}
                : closest;
        }, null).pos;

        const position = this.scene.grid.gridToIso(validPosition.x, validPosition.y);
        await this.moveNPC(npc, position.tileX, position.tileY);
        npc.gridX = validPosition.x;
        npc.gridY = validPosition.y;
    }

    async moveNPC(npc, targetX, targetY) {
        // Validar limites antes de mover
        if (!this.scene.grid.isValidPosition(targetX / this.scene.grid.tileWidth, targetY / this.scene.grid.tileHeight)) {
            console.log('Destino fora dos limites do mapa');
            return Promise.resolve(false);
        }
        
        return new Promise(resolve => {
            const nameTextY = targetY - 64;
            
            // Limpar gráficos anteriores se existirem
            if (npc.pathGraphics) {
                npc.pathGraphics.destroy();
            }
            
            // Criar linha pontilhada
            npc.pathGraphics = this.scene.add.graphics();
            npc.pathGraphics.lineStyle(2, 0xffffff, 0.8);
            npc.pathGraphics.beginPath();
            npc.pathGraphics.moveTo(npc.sprite.x, npc.sprite.y - 32);
            npc.pathGraphics.lineTo(targetX, targetY - 32);
            npc.pathGraphics.strokePath();

            // Adicionar efeito pontilhado com fade
            const length = Phaser.Math.Distance.Between(npc.sprite.x, npc.sprite.y, targetX, targetY);
            const dots = Math.floor(length / 8);
            for (let i = 0; i < dots; i++) {
                const t = i / dots;
                const x = Phaser.Math.Linear(npc.sprite.x, targetX, t);
                const y = Phaser.Math.Linear(npc.sprite.y - 32, targetY - 32, t);
                const alpha = 1 - (i / dots);
                npc.pathGraphics.fillStyle(0xffffff, alpha);
                npc.pathGraphics.fillCircle(x, y, 2);
            }

            // Calcular duração baseada na distância
            const duration = this.calculateMovementDuration(npc.sprite.x, npc.sprite.y, targetX, targetY);
            
            // Adicionar efeito de aceleração/desaceleração
            this.scene.tweens.add({
                targets: [npc.sprite, npc.nameText],
                x: targetX,
                y: (target, key, value, targetIndex) => {
                    return targetIndex === 0 ? targetY - 32 : nameTextY;
                },
                duration: duration,
                ease: 'Power2',
                onUpdate: () => {
                    npc.sprite.setDepth(npc.gridY + 2);
                    npc.nameText.setDepth(npc.gridY + 3);
                },
                onComplete: () => {
                    if (npc.pathGraphics) {
                        this.scene.tweens.add({
                            targets: npc.pathGraphics,
                            alpha: 0,
                            duration: 200,
                            onComplete: () => {
                                npc.pathGraphics.destroy();
                                npc.pathGraphics = null;
                            }
                        });
                    }
                    resolve();
                }
            });
        });
    }

    calculateMovementDuration(startX, startY, endX, endY) {
        const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        // Ajuste a velocidade base e o fator de aceleração
        const baseSpeed = 80;
        const speedFactor = Math.min(1.5, Math.max(0.8, distance / 200));
        return (distance / (baseSpeed * speedFactor));
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

        // Adiciona o texto "Toc" que aparece e desaparece
        const tocText = this.scene.add.text(tree.sprite.x, tree.sprite.y - 40, 'Toc', {
            fontSize: '20px',
            fill: '#000',
            stroke: '#fff',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Cria uma animação para o texto
        let tocCount = 0;
        const tocInterval = setInterval(() => {
            tocText.setVisible(true);
            tocText.setY(tree.sprite.y - 40);
            this.scene.tweens.add({
                targets: tocText,
                y: tree.sprite.y - 60,
                alpha: { from: 1, to: 0 },
                duration: 500,
                onComplete: () => {
                    tocText.setVisible(false);
                }
            });
            tocCount++;
        }, 800);

        await this.waitFor(this.cuttingTime);
        clearInterval(tocInterval);
        tocText.destroy();
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
        
        // Encontrar posição adjacente ao silo
        const adjacentPositions = [
            {x: silo.gridX + 1, y: silo.gridY},
            {x: silo.gridX - 1, y: silo.gridY},
            {x: silo.gridX, y: silo.gridY + 1},
            {x: silo.gridX, y: silo.gridY - 1}
        ];

        // Encontrar posição válida mais próxima
        const validPosition = adjacentPositions.find(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.isTileOccupied(pos.x, pos.y)
        ) || adjacentPositions[0];

        const position = this.scene.grid.gridToIso(validPosition.x, validPosition.y);
        await this.moveNPC(npc, position.tileX, position.tileY);
        npc.gridX = validPosition.x;
        npc.gridY = validPosition.y;
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

    isPositionOccupiedByNPC(x, y) {
        // Verifica se há outro NPC na posição
        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.npc && value.npc.gridX === x && value.npc.gridY === y) {
                return true;
            }
        }
        return false;
    }

    stopWorking() {
        this.isWorking = false;
        if (this.currentNPC && this.currentNPC.pathGraphics) {
            this.currentNPC.pathGraphics.destroy();
            this.currentNPC.pathGraphics = null;
        }
    }
}
