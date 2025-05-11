export default class LumberSystem {
    constructor(scene) {
        this.scene = scene;
        this.isWorking = false;
        this.pathGraphics = null;
    }

    startWorking(npc) {
        if (this.isWorking) return;

        this.isWorking = true;
        npc.isAutonomous = false;
        console.log('Iniciando trabalho do lenhador:', npc.config.name);

        // Iniciar ciclo de trabalho
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

                // 2. Ir até a árvore
                const canReach = await this.moveToTree(npc, tree);
                if (!canReach) {
                    console.log('Não foi possível alcançar a árvore');
                    await this.waitFor(1000);
                    continue;
                }

                // 3. Cortar a árvore
                await this.cutTree(npc, tree);

                // 4. Procurar silo
                const silo = this.findNearestSilo(npc);
                if (!silo) {
                    console.log('Nenhum silo encontrado');
                    await this.waitFor(1000);
                    continue;
                }

                // 5. Ir até o silo
                await this.moveToSilo(npc, silo);

                // 6. Depositar recursos
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
            if (value && value.type === 'tree' && !value.isCut) {
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
                }
            }
        }

        return nearestTree;
    }

    findNearestSilo(npc) {
        let nearestSilo = null;
        let shortestDistance = Infinity;

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value && value.buildingType === 'silo') {
                const [x, y] = key.split(',').map(Number);
                const distance = Math.abs(npc.gridX - x) + Math.abs(npc.gridY - y);

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestSilo = { gridX: x, gridY: y };
                }
            }
        }

        return nearestSilo;
    }

    async moveToTree(npc, tree) {
        // Encontrar posição adjacente à árvore
        const adjacentPositions = [
            {x: tree.gridX + 1, y: tree.gridY},
            {x: tree.gridX - 1, y: tree.gridY},
            {x: tree.gridX, y: tree.gridY + 1},
            {x: tree.gridX, y: tree.gridY - 1}
        ].filter(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]
        );

        if (adjacentPositions.length === 0) return false;

        // Escolher posição mais próxima
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
        npc.config.emoji = '🪓';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

        // Efeito de corte
        const particles = this.scene.add.particles(0, 0, 'tile_grass', {
            x: tree.sprite.x,
            y: tree.sprite.y,
            speed: 100,
            scale: { start: 0.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD'
        });

        // Esperar tempo de corte
        await this.waitFor(2000);

        // Adicionar madeira ao inventário
        if (npc.addItemToStorage('wood')) {
          console.log(`[${npc.config.name}] Cortou madeira`);
        } else {
          console.log(`[${npc.config.name}] Inventário cheio!`);
        }

        // Marcar árvore como cortada
        const key = `${tree.gridX},${tree.gridY}`;
        this.scene.grid.buildingGrid[key].isCut = true;
        tree.sprite.setAlpha(0.5);

        particles.destroy();
    }

    async moveToSilo(npc, silo) {
        const adjacentPositions = [
            {x: silo.gridX + 1, y: silo.gridY},
            {x: silo.gridX - 1, y: silo.gridY},
            {x: silo.gridX, y: silo.gridY + 1},
            {x: silo.gridX, y: silo.gridY - 1}
        ].filter(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.grid.buildingGrid[`${pos.x},${pos.y}`]
        );

        for (const pos of adjacentPositions) {
            npc.config.emoji = '🚶';
            npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
            this.drawPathLine(npc, pos.x, pos.y);
            await npc.moveTo(pos.x, pos.y);
            return true;
        }

        return false;
    }

    async depositResources(npc) {
        if (npc.inventory.wood > 0) {
            npc.config.emoji = '📦';
            npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

            const depositParticles = this.scene.add.particles(0, 0, 'tile_grass', {
                x: npc.sprite.x,
                y: npc.sprite.y,
                speed: 50,
                scale: { start: 0.2, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 1000,
                blendMode: 'ADD'
            });

            // Resetar inventário
            npc.inventory.wood = 0;

            // Feedback visual
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
    }

    waitFor(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }

    stopWorking() {
        this.isWorking = false;
    }
}