placeBuilding(gridX, gridY, worldX, worldY) {
    if (!this.validateBuildingPlacement(gridX, gridY)) {
        return false;
    }

    const building = this.createBuilding(gridX, gridY);
    if (!building) {
        return false;
    }

    this.registerBuildingEvents(building);
    this.updateGridState(gridX, gridY, building);
    this.provideVisualFeedback(gridX, gridY);

    // Validar se é uma casa que pode ter NPC
    const npcHouses = ['farmerHouse', 'minerHouse', 'fishermanHouse', 'lumberHouse'];
    const isNPCHouse = npcHouses.includes(this.selectedBuilding);

    // Create NPC for each house if it's a valid house type
    if (['farmerHouse', 'minerHouse', 'fishermanHouse', 'lumberHouse'].includes(this.selectedBuilding)) {
        this.createFarmerNPC(gridX, gridY, worldX, worldY);
    }

    // Add click handler for silo
    if (this.selectedBuilding === 'silo') {
        building.setInteractive({ useHandCursor: true });
        building.on('pointerdown', (pointer) => {
            if (!pointer.rightButtonDown()) {
                this.showSiloModal([
            { name: 'Sementes', icon: '🌾', amount: 0 },
            { name: 'Trigo', icon: '🌾', amount: 0 },
            { name: 'Cenoura', icon: '🥕', amount: 0 },
            { name: 'Milho', icon: '🌽', amount: 0 },
            { name: 'Madeira', icon: '🪵', amount: 0 },
            { name: 'Peixe', icon: '🐟', amount: 0 },
            { name: 'Minério', icon: '⛏️', amount: 0 }
        ]);
            }
        });
    }

    return true;
}

validateBuildingPlacement(gridX, gridY) {
    return this.grid.isValidPosition(gridX, gridY) && 
           !this.grid.isOccupied(gridX, gridY);
}

createBuilding(gridX, gridY) {
    try {
        const building = this.add.sprite(
            gridX * this.grid.tileWidth,
            gridY * this.grid.tileHeight,
            this.selectedBuilding
        );
        building.setDepth(1);
        return building;
    } catch (error) {
        console.error('Failed to create building:', error);
        return null;
    }
}

provideVisualFeedback(gridX, gridY) {
    const tile = this.grid.grid[gridY][gridX];
    if (tile) {
        this.tweens.add({
            targets: tile,
            alpha: { from: 1, to: 0.5 },
            yoyo: true,
            duration: 200,
            ease: 'Power2'
        });
    }
}

autoSave() {
        if (!this.farmer || !this.grid) {
            console.warn('Cannot save: game state not fully initialized');
            return;
        }

        try {
            const timestamp = new Date().toISOString();
            const gameState = {
                version: '1.0',
                timestamp: timestamp,
                buildingGrid: {},
                farmerPosition: {
                    x: this.farmer.gridX,
                    y: this.farmer.gridY
                },
                camera: {
                    zoom: this.cameras.main.zoom,
                    scrollX: this.cameras.main.scrollX,
                    scrollY: this.cameras.main.scrollY
                }
            };

            // Validate and convert building grid
            Object.entries(this.grid.buildingGrid).forEach(([key, value]) => {
                if (!value || !value.gridX || !value.gridY) return;

                gameState.buildingGrid[key] = {
                    type: value.type,
                    gridX: value.gridX,
                    gridY: value.gridY,
                    buildingType: value.sprite?.texture?.key || null
                };
            });

            // Registrar no grid
            this.grid.buildingGrid[key] = {
                sprite: building,
                type: 'building',
                buildingType: this.selectedBuilding,
                gridX: gridX,
                gridY: gridY
            };

            // Adicionar interatividade ao silo
            if (this.selectedBuilding === 'silo') {
                building.setInteractive({ useHandCursor: true });
                building.on('pointerdown', (pointer) => {
                    if (!pointer.rightButtonDown()) {
                        this.showSiloModal([
                            { name: 'Sementes', icon: '🌾', amount: 0 },
                            { name: 'Trigo', icon: '🌾', amount: 0 },
                            { name: 'Cenoura', icon: '🥕', amount: 0 },
                            { name: 'Milho', icon: '🌽', amount: 0 },
                            { name: 'Madeira', icon: '🪵', amount: 0 },
                            { name: 'Peixe', icon: '🐟', amount: 0 },
                            { name: 'Minério', icon: '⛏️', amount: 0 }
                        ]);
                    }
                });
            }

            // Create NPC for each house if it's a valid house type
            const backupKey = `gameState_backup_${timestamp}`;
            const backups = JSON.parse(localStorage.getItem('gameStateBackups') || '[]');
            backups.unshift(backupKey);
            while (backups.length > 3) {
                const oldBackup = backups.pop();
                localStorage.removeItem(oldBackup);
            }
            localStorage.setItem('gameStateBackups', JSON.stringify(backups));
            localStorage.setItem(backupKey, JSON.stringify(gameState));

            // Save current state
            localStorage.setItem('gameState', JSON.stringify(gameState));

            // Visual feedback
            const saveIndicator = document.querySelector('.save-indicator');
            if (saveIndicator) {
                saveIndicator.classList.add('saving');
                setTimeout(() => {
                    saveIndicator.classList.remove('saving');
                }, 1000);
            }

            this.showFeedback('Jogo salvo!', true);
        } catch (error) {
            console.error('Error saving game:', error);
            this.showFeedback('Erro ao salvar o jogo', false);

            // Try to save minimal state in emergency backup
            try {
                const minimalState = {
                    farmerPosition: {
                        x: this.farmer.gridX,
                        y: this.farmer.gridY
                    },
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('gameState_emergency', JSON.stringify(minimalState));
            } catch (emergencyError) {
                console.error('Emergency save failed:', emergencyError);
            }
        }
    }
}

showSiloModal(resources) {
        const existingModal = document.querySelector('.silo-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'silo-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            width: 80%;
            max-width: 500px;
        `;
        modal.innerHTML = `
            <div class="silo-content">
                <div class="silo-header">
                    <h2 class="silo-title">🏗️ Armazém de Recursos</h2>
                    <button class="close-button">✕</button>
                </div>
                <div class="resources-grid">
                    ${resources.map(resource => `
                        <div class="resource-item">
                            <div class="resource-icon">${resource.icon}</div>
                            <div class="resource-name">${resource.name}</div>
                            <div class="resource-amount">${resource.amount}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Fechar modal
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => modal.remove();

        // Fechar ao clicar fora
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    enablePlayerControl(npc) {
        // Cria o painel de controle do fazendeiro
        const panel = document.createElement('div');
        panel.className = 'npc-control-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            color: white;
            text-align: center;
        `;

        // Título do painel
        const title = document.createElement('h2');
        title.textContent = `${npc.config.name}`;
        title.style.cssText = `
            margin: 0 0 15px 0;
            text-align: center;
            width: 100%;
            font-size: 1.4em;
            padding: 5px 0;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        `;
        panel.appendChild(title);

        // Lista de trabalhos
        const jobsList = document.createElement('div');
        jobsList.className = 'jobs-list';
        jobsList.style.display = 'flex';
        jobsList.style.gap = '10px';
        jobsList.style.justifyContent = 'center';

        // Obtém os trabalhos disponíveis para o NPC
        const availableJobs = this.getAvailableJobs(npc);

        // Cria botões para cada trabalho
        availableJobs.forEach(job => {
            const button = document.createElement('button');
            button.textContent = `${job.icon} ${job.name}`;
            button.dataset.job = job.id;
            button.style.padding = '10px 15px';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';
            button.style.backgroundColor = '#5cb85c';
            button.style.color = 'white';
            button.style.fontSize = '16px';
            button.style.fontWeight = 'bold';
            button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            button.style.transition = 'background-color 0.3s ease';
            button.onmouseover = () => button.style.backgroundColor = '#4cae4c';
            button.onmouseout = () => button.style.backgroundColor = '#5cb85c';
            jobsList.appendChild(button);

            button.onclick = (e) => {
                const jobId = button.dataset.job;
                if (jobId === 'lumber' && npc.config.profession === 'Lumberjack') {
                    if (!npc.lumberSystem) {
                        npc.lumberSystem = new LumberSystem(this);
                    }
                    npc.isAutonomous = false;
                    npc.currentJob = 'lumber';
                    npc.config.emoji = '🪓';
                    npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                    npc.lumberSystem.startWorking(npc);
                } else if (jobId === 'miner' && npc.config.profession === 'Miner') {
                    if (!npc.mineSystem) {
                        npc.mineSystem = new MineSystem(this);
                    }
                    npc.isAutonomous = false;
                    npc.currentJob = 'miner';
                    npc.config.emoji = '⛏️';
                    npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                    npc.mineSystem.startWorking(npc);
                }
            };
        });
        panel.appendChild(jobsList);

        // Botão para fechar o painel
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fechar Painel';
        closeButton.style.marginTop = '15px';
        closeButton.style.padding = '10px 15px';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.backgroundColor = '#d9534f';
        closeButton.style.color = 'white';
        closeButton.style.fontSize = '16px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        closeButton.style.transition = 'background-color 0.3s ease';
        closeButton.onmouseover = () => closeButton.style.backgroundColor = '#c9302c';
        closeButton.onmouseout = () => closeButton.style.backgroundColor = '#d9534f';
        panel.appendChild(closeButton);
        closeButton.onclick = () => panel.remove();

        document.body.appendChild(panel);
    }

    getAvailableJobs(npc) {
        const jobs = [];
        if (npc.config.profession === 'Lumberjack') {
            jobs.push({ id: 'lumber', name: 'Cortar Lenha', icon: '🪓', description: 'Cortar árvores para obter madeira' });
        } else if (npc.config.profession === 'Miner') {
            jobs.push({ id: 'miner', name: 'Minerar', icon: '⛏️', description: 'Minerar rochas para obter minério' });
        }
        return jobs;
    }
}