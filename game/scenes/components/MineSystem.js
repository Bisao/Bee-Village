export default class MineSystem {
    constructor(scene) {
        this.scene = scene;
        this.state = {
            isWorking: false,
            isProcessingRock: false
        };
        this.minerNPC = null;

        this.config = {
            miningTime: 18000, // Tempo para minerar uma pedra
            respawnTime: 75000, // Tempo para a pedra reaparecer (placeholder)
            searchRadius: 10,   // Raio de busca por pedras
            maxInventory: 4     // Máximo de minério que o NPC pode carregar
        };

        this.resources = {
            ore: '🪨', // Emoji para minério/pedra
            stone: '🧱' // Emoji para pedra processada (exemplo)
        };
        console.log("MineSystem initialized with new structure");
    }

    // --- Métodos Principais ---
    startWorking(npc) {
        if (!this.validateNPC(npc)) return;
        // Tenta fazer o NPC sair de casa. Se não conseguir, não inicia o trabalho.
        if (npc && typeof npc.leaveHouse === 'function') {
            if (!npc.leaveHouse()) {
                console.log("[MineSystem] NPC não conseguiu sair da casa.");
                return; // Interrompe se não puder sair
            }
        } else {
            console.warn("[MineSystem] Função npc.leaveHouse() não encontrada.");
            // Decide se quer prosseguir mesmo assim ou retornar
        }

        this.state.isWorking = true;
        this.minerNPC = npc; // Guarda a referência do NPC
        npc.currentJob = 'mine';
        npc.isAutonomous = true; // Garante que o NPC está em modo autônomo para o ciclo
        console.log(`[MineSystem] ${npc.config.name} começou a minerar.`);
        this.scene.showFeedback(`${npc.config.name} está indo minerar!`, true);
        this.workCycle(npc); // Inicia o ciclo de trabalho
    }

    async workCycle(npc) {
        while (this.state.isWorking && npc.currentJob === 'mine') {
            try {
                if (this.state.isProcessingRock) {
                    await this.waitFor(1000); // Espera se já estiver processando uma rocha
                    continue;
                }

                // Verifica se o inventário está cheio antes de procurar mais rochas
                if (npc.inventory.ore >= this.config.maxInventory) {
                    await this.depositOre(npc); // Deposita minério se o inventário estiver cheio
                    // Se após depositar ainda estiver cheio (ex: silo cheio), espera antes de tentar de novo
                    if (npc.inventory.ore >= this.config.maxInventory) {
                        this.updateNPCStatus(npc, '⚠️', 'Silo cheio');
                        npc.returnHome();
                        npc.currentJob = 'rest';
                        this.stopWorking(npc, false);
                        return;
                    }
                }

                const rock = await this.findAndProcessRock(npc);
                if (!rock) {
                    // Se não encontrar rochas, o NPC pode descansar ou esperar
                    this.updateNPCStatus(npc, '😴', 'Descansando');
                    await this.waitFor(5000); // Espera um pouco antes de procurar novamente
                    continue;
                }

            } catch (error) {
                console.error('[MineSystem] Erro no ciclo de trabalho:', error);
                this.updateNPCStatus(npc, '⚠️', 'Erro');
                await this.waitFor(5000); // Espera em caso de erro
            }
        }
        console.log(`[MineSystem] ${npc.config.name} parou o ciclo de mineração.`);
        if (npc.currentJob !== 'mine') { // Se o trabalho mudou, não tenta retornar para casa automaticamente aqui
           this.stopWorking(npc, false); // Apenas para o sistema, não força retorno
        }
    }

    stopWorking(npc = this.minerNPC, returnToHouse = true) {
        this.state.isWorking = false;
        this.state.isProcessingRock = false;
        if (npc) {
            console.log(`[MineSystem] ${npc.config.name} parou de minerar.`);
            if (returnToHouse && npc.isAutonomous && typeof npc.returnHome === 'function') {
                npc.returnHome();
            }
        }
        // this.minerNPC = null; // Limpa a referência se não for mais gerenciado por este sistema
    }

    // --- Gerenciamento de Rochas ---
    async findAndProcessRock(npc) {
        this.updateNPCStatus(npc, '🔍', 'Procurando Rocha');
        const rock = this.findNearestRock(npc);

        if (!rock) {
            console.log('[MineSystem] Nenhuma rocha encontrada nas proximidades.');
            return null;
        }

        this.updateNPCStatus(npc, '🚶', 'Indo até a Rocha');
        const reached = await this.moveToRock(npc, rock);

        if (!reached) {
            console.log('[MineSystem] Não foi possível alcançar a rocha.');
            return null;
        }

        if (this.isAdjacentToRock(npc, rock)) {
            await this.mineRock(npc, rock);
            return rock;
        }
        console.log('[MineSystem] NPC não está adjacente à rocha após mover-se.');
        return null;
    }

    findNearestRock(npc) {
        let nearestRock = null;
        let shortestDistance = Infinity;

        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (!this.isValidRock(value)) continue;

            const [rockX, rockY] = key.split(',').map(Number);
            const distance = Math.abs(npc.gridX - rockX) + Math.abs(npc.gridY - rockY);

            if (distance <= this.config.searchRadius) {
                const adjacentPos = this.findBestAdjacentPosition(rockX, rockY);
                if (adjacentPos && distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestRock = {
                        gridX: rockX,
                        gridY: rockY,
                        targetX: adjacentPos.x,
                        targetY: adjacentPos.y,
                        sprite: value.sprite,
                        key: key
                    };
                }
            }
        }
        return nearestRock;
    }

    async mineRock(npc, rock) {
        if (!this.isAdjacentToRock(npc, rock)) {
            console.log('[MineSystem] NPC não está adjacente para minerar.');
            return false;
        }

        this.state.isProcessingRock = true;
        this.updateNPCStatus(npc, '⛏️', 'Minerando');

        const mineEffectInterval = this.createMineEffect(rock); // Inicia efeito visual
        await this.waitFor(this.config.miningTime); // Espera o tempo de mineração
        clearInterval(mineEffectInterval); // Para efeito visual
        if (rock.sprite) {
            rock.sprite.clearTint(); // Limpa qualquer tintura do efeito
        }

        const success = await this.processRockMined(npc, rock);
        this.state.isProcessingRock = false;
        return success;
    }

    async processRockMined(npc, rock) {
        const rockData = this.scene.grid.buildingGrid[rock.key];
        if (!rockData || rockData.isMined) {
            console.log("[MineSystem] Rocha já minerada ou não encontrada no grid.");
            return false;
        }

        if (!npc.hasInventorySpace('ore')) {
            this.scene.showFeedback(`${npc.config.name}: Inventário de minério cheio!`, false);
            return false;
        }

        if (!this.isAdjacentToRock(npc, rockData)) {
            console.log("[MineSystem] NPC não está adjacente à rocha.");
            return false;
        }

        rockData.isMined = true;
        if (rockData.sprite) {
            rockData.sprite.setVisible(false);

            // Efeito de partículas ao minerar
            const particles = this.scene.add.particles(0, 0, 'tile_grass', {
                x: rockData.sprite.x,
                y: rockData.sprite.y,
                speed: { min: 50, max: 100 },
                scale: { start: 0.2, end: 0 },
                alpha: { start: 0.6, end: 0 },
                lifespan: 800,
                quantity: 5
            });

            particles.start();
            this.scene.time.delayedCall(800, () => particles.destroy());
        }

        if (npc.addItemToStorage('ore')) {
            this.scene.showFeedback(`+1 ${this.resources.ore} coletado por ${npc.config.name}!`, true);
            this.updateInventoryUI(npc);
            this.scheduleRockRespawn(rockData);
            return true;
        }
        return false;
    }

    scheduleRockRespawn(rockData) {
        if (!rockData) return;
        this.scene.time.delayedCall(this.config.respawnTime, () => {
            if (rockData) {
                rockData.isMined = false;
                if (rockData.sprite) {
                    rockData.sprite.setVisible(true);
                    console.log(`[MineSystem] Rocha em ${rockData.gridX},${rockData.gridY} reapareceu.`);
                }
            }
        });
    }

    // --- Gerenciamento de Recursos (Depósito) ---
    async depositOre(npc) {
        const silo = this.findNearestSilo(npc);
        if (!silo) {
            console.log('[MineSystem] Nenhum silo encontrado para depósito.');
            this.updateNPCStatus(npc, '⚠️', 'Sem Silo');
            await this.waitFor(10000);
            return;
        }

        // Verifica se há espaço no silo antes de tentar mover
        const hasSpace = this.scene.resourceSystem.hasSiloSpace(silo.gridX, silo.gridY, 'ore', npc.inventory.ore);
        if (!hasSpace) {
            this.updateNPCStatus(npc, '⚠️', 'Silo Cheio');
            this.scene.showFeedback(`${npc.config.name}: Silo está cheio!`, false);
            npc.returnHome();
            npc.currentJob = 'rest';
            this.stopWorking(npc, false);
            return;
        }

        this.updateNPCStatus(npc, '🚶', 'Indo ao Silo');
        const adjacentPos = this.findBestAdjacentPosition(silo.gridX, silo.gridY);
        
        if (!adjacentPos) {
            console.log('[MineSystem] Não há posições adjacentes disponíveis ao silo');
            return;
        }

        const reached = await npc.moveTo(adjacentPos.x, adjacentPos.y);

        if (reached && this.isAdjacentToSilo(npc, silo)) {
            this.updateNPCStatus(npc, '📦', 'Depositando Minério');
            await this.processDeposit(npc, silo);
        } else {
            console.log('[MineSystem] Não foi possível alcançar o silo após várias tentativas.');
            this.scene.showFeedback(`${npc.config.name} não consegue alcançar o silo!`, false);
            await this.waitFor(3000);
        }
    }

    findAlternativePosition(siloX, siloY) {
        const positions = [
            {x: siloX + 1, y: siloY},
            {x: siloX - 1, y: siloY},
            {x: siloX, y: siloY + 1},
            {x: siloX, y: siloY - 1},
            {x: siloX + 1, y: siloY + 1},
            {x: siloX - 1, y: siloY - 1},
            {x: siloX + 1, y: siloY - 1},
            {x: siloX - 1, y: siloY + 1}
        ];

        return positions.find(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.grid.isTileOccupiedByBuildingOrNPC(pos.x, pos.y)
        );
    }

    async processDeposit(npc, silo) {
        if (!this.validateDeposit(npc, silo)) return false;
        
        await this.waitFor(2000);
        const amountToDeposit = npc.inventory.ore;
        
        console.log(`[MineSystem] Tentando depositar ${amountToDeposit} minérios de ${npc.config.name}`);
            
        if (this.scene.resourceSystem.depositResource(silo.gridX, silo.gridY, 'ore', amountToDeposit)) {
            // Garantimos que apenas o inventário deste NPC específico seja zerado
            console.log(`[MineSystem] Depósito bem-sucedido para ${npc.config.name}, zerando apenas seu inventário`);
            npc.inventory.ore = 0;
            this.scene.showFeedback(`${amountToDeposit} ${this.resources.ore} depositado por ${npc.config.name}!`, true);
            this.createDepositEffect(silo);
            this.updateInventoryUI(npc);
            return true;
        }
        
        this.handleDepositFailure(npc);
        return false;
    }

    validateDeposit(npc, silo) {
        if (!npc?.inventory?.ore) {
            console.log('[MineSystem] NPC inválido ou sem minério');
            return false;
        }

        if (!silo || !this.scene.resourceSystem.hasSiloSpace(silo.gridX, silo.gridY, 'ore', npc.inventory.ore)) {
            console.log('[MineSystem] Silo não encontrado ou sem espaço suficiente');
            this.handleDepositFailure(npc);
            return false;
        }

        return true;
    }

    handleDepositFailure(npc) {
        this.scene.showFeedback(`${npc.config.name}: Não foi possível depositar o minério!`, false);
        this.updateNPCStatus(npc, '⚠️', 'Sem silo disponível');
        npc.returnHome();
        npc.currentJob = 'rest';
        this.stopWorking(npc, false);
    }

    createDepositEffect(silo) {
        const depositEffect = this.scene.add.particles(0, 0, 'tile_grass', {
            x: silo.sprite.x,
            y: silo.sprite.y - 20,
            speed: { min: 50, max: 100 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 800,
            quantity: 5
        });

        depositEffect.start();
        this.scene.time.delayedCall(800, () => depositEffect.destroy());
    }

    // --- Métodos Auxiliares ---
    validateNPC(npc) {
        if (!npc || npc.config.profession !== 'Miner') {
            console.warn('[MineSystem] NPC inválido ou não é um Minerador.');
            return false;
        }
        
        if (!npc.inventory || typeof npc.inventory.ore === 'undefined') {
            console.warn('[MineSystem] Inventário do NPC não está configurado para minério.');
            npc.inventory = npc.inventory || {}; // Garante que o inventário exista
            npc.inventory.ore = 0; // Inicializa o minério se não existir
        }
        return true;
    }

    isValidRock(tile) {
        // Considera 'rock_small', 'rock_medium', 'rock_large' como tipos de rocha mineráveis
        const rockTypes = ['rock_small', 'rock_medium', 'rock_large'];
        return tile && 
               tile.type === 'rock' && // Certifica que o 'type' no grid seja 'rock'
               tile.sprite && 
               !tile.isMined && // Verifica se já foi minerada
               rockTypes.includes(tile.sprite.texture.key); // Verifica se a textura é de uma rocha minerável
    }

    isAdjacentToRock(npc, rock) {
        const dx = Math.abs(npc.gridX - rock.gridX);
        const dy = Math.abs(npc.gridY - rock.gridY);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    isAdjacentToSilo(npc, silo) {
        const dx = Math.abs(npc.gridX - silo.gridX);
        const dy = Math.abs(npc.gridY - silo.gridY);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    findBestAdjacentPosition(targetX, targetY) {
        const positions = [
            {x: targetX + 1, y: targetY},
            {x: targetX - 1, y: targetY},
            {x: targetX, y: targetY + 1},
            {x: targetX, y: targetY - 1}
        ];

        return positions.find(pos => 
            this.scene.grid.isValidPosition(pos.x, pos.y) && 
            !this.scene.grid.isTileOccupiedByBuildingOrNPC(pos.x, pos.y, this.minerNPC)
        );
    }

    async moveToRock(npc, rock) {
        if (!rock) return false;

        const adjacentPos = this.findBestAdjacentPosition(rock.gridX, rock.gridY);
        if (!adjacentPos) return false;

        await npc.moveTo(adjacentPos.x, adjacentPos.y);
        return this.isAdjacentToRock(npc, rock);
    }

    findNearestSilo(npc) {
        let nearestSilo = null;
        let shortestDistance = Infinity;
        
        console.log('[MineSystem] Iniciando busca por silo para', npc.config.name);
        
        // Primeiro, vamos listar todos os silos disponíveis no grid
        const silos = [];
        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.type === 'silo') {
                const [siloX, siloY] = key.split(',').map(Number);
                silos.push({ key, x: siloX, y: siloY, value });
                console.log('[MineSystem] Silo encontrado em', siloX, siloY);
            }
        }
        
        if (silos.length === 0) {
            console.log('[MineSystem] Nenhum silo encontrado no grid');
            return null;
        }
        
        // Agora vamos verificar cada silo
        for (const silo of silos) {
            const distance = Math.abs(npc.gridX - silo.x) + Math.abs(npc.gridY - silo.y);
            
            // Verificamos se o ResourceSystem está disponível
            if (!this.scene.resourceSystem) {
                console.log('[MineSystem] ResourceSystem não disponível');
                continue;
            }
            
            // Verificamos se o silo tem espaço
            let hasSpace = false;
            try {
                hasSpace = this.scene.resourceSystem.hasSiloSpace(silo.x, silo.y, 'ore', npc.inventory.ore);
                console.log(`[MineSystem] Silo em ${silo.x},${silo.y} tem espaço: ${hasSpace}`);
            } catch (error) {
                console.error('[MineSystem] Erro ao verificar espaço no silo:', error);
                continue;
            }
            
            if (hasSpace) {
                const adjacentPos = this.findBestAdjacentPosition(silo.x, silo.y);
                if (adjacentPos && distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestSilo = {
                        gridX: silo.x,
                        gridY: silo.y,
                        sprite: silo.value.sprite,
                        targetX: adjacentPos.x,
                        targetY: adjacentPos.y
                    };
                    console.log(`[MineSystem] Silo válido encontrado em ${silo.x},${silo.y}, distância: ${distance}`);
                } else {
                    console.log(`[MineSystem] Silo em ${silo.x},${silo.y} não tem posição adjacente disponível`);
                }
            } else {
                console.log(`[MineSystem] Silo em ${silo.x},${silo.y} não tem espaço suficiente`);
            }
        }
        
        if (!nearestSilo) {
            console.log('[MineSystem] Nenhum silo com espaço disponível encontrado');
        } else {
            console.log(`[MineSystem] Silo mais próximo encontrado em ${nearestSilo.gridX},${nearestSilo.gridY}`);
        }
        
        return nearestSilo;
    }

    // --- UI e Efeitos Visuais ---
    createMineEffect(rock) {
        let effectCounter = 0;
        return setInterval(() => {
            if (!rock.sprite?.active || !this.state.isProcessingRock) return;

            const effectText = effectCounter % 2 === 0 ? '⛏️' : '💥';
            const text = this.scene.add.text(
                rock.sprite.x + (Math.random() * 20 - 10), 
                rock.sprite.y - 20 + (Math.random() * 10 - 5),
                effectText, 
                {
                    fontSize: '18px',
                    fill: '#FFF',
                    stroke: '#000',
                    strokeThickness: 2
                }
            ).setDepth(rock.sprite.depth + 1).setOrigin(0.5);

            this.scene.tweens.add({
                targets: text,
                y: text.y - 15,
                alpha: 0,
                duration: 700,
                ease: 'Power1',
                onComplete: () => text.destroy()
            });

            // Simula um leve tremor na rocha
            if (effectCounter % 3 === 0) {
                 this.scene.tweens.add({
                    targets: rock.sprite,
                    x: rock.sprite.x + (Math.random() > 0.5 ? 2 : -2),
                    yoyo: true,
                    duration: 80,
                    repeat: 1
                });
            }
            effectCounter++;
        }, 600);
    }

    updateNPCStatus(npc, emoji, statusText) {
        if (npc && npc.config && npc.nameText) {
            npc.config.emoji = emoji;
            npc.nameText.setText(`${emoji} ${npc.config.name}`);
        }
        console.log(`[MineSystem] ${npc?.config?.name || 'NPC'}: ${statusText}`);
    }

    updateInventoryUI(npc) {
        const modal = document.querySelector('.npc-modal');
        if (modal && modal.dataset.npcId === npc.id) {
            const storageSlots = modal.querySelectorAll('.storage-slot');
            storageSlots.forEach((slot, index) => {
                const hasOre = index < npc.inventory.ore;
                slot.querySelector('.storage-amount').textContent = hasOre ? '1/1' : '0/1';
            });
        }
    }

    waitFor(ms) {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }
}