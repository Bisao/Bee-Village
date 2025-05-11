
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

        npc.config.emoji = '🚶';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
        
        // Encontrar posição adjacente à árvore
        const adjacentPositions = [
            {x: tree.gridX + 1, y: tree.gridY},
            {x: tree.gridX - 1, y: tree.gridY},
            {x: tree.gridX, y: tree.gridY + 1},
            {x: tree.gridX, y: tree.gridY - 1}
        ].filter(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.isTileOccupied(pos.x, pos.y)
        );

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
        return new Promise(resolve => {
            const nameTextY = targetY - 64;
            
            // Criar linha pontilhada
            const pathGraphics = this.scene.add.graphics();
            pathGraphics.lineStyle(2, 0xffffff, 0.8);
            pathGraphics.beginPath();
            pathGraphics.moveTo(npc.sprite.x, npc.sprite.y - 32);
            pathGraphics.lineTo(targetX, targetY - 32);
            pathGraphics.strokePath();

            // Adicionar efeito pontilhado
            const length = Phaser.Math.Distance.Between(npc.sprite.x, npc.sprite.y, targetX, targetY);
            const dots = Math.floor(length / 10);
            for (let i = 0; i < dots; i++) {
                const t = i / dots;
                const x = Phaser.Math.Linear(npc.sprite.x, targetX, t);
                const y = Phaser.Math.Linear(npc.sprite.y - 32, targetY - 32, t);
                pathGraphics.fillCircle(x, y, 2);
            }
            
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
                    pathGraphics.destroy();
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

    stopWorking() {
        this.isWorking = false;
    }
}
