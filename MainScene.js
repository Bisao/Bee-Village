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
        const npc = await this.npcManager.createFarmerNPC(gridX, gridY, worldX, worldY);

        // Iniciar sistema de mineração se for uma casa de minerador
        if (this.selectedBuilding === 'minerHouse' && npc.config.profession === 'Miner') {
            this.MineSystem = MineSystem; // Torna o MineSystem disponível na cena
            npc.mineSystem = new MineSystem(this);
            npc.mineSystem.startWorking(npc);
        }
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

    enablePlayerControl(npc) {
constructor() {
        super({ key: 'MainScene' });
        this.selectedBuilding = null;
        this.previewBuilding = null;
        this.resourceSystem = null;
        this.npcControlPanel = null;
    }

    create() {
        // Existing create code...
        import('./components/UI/NPCControlPanel.js').then(({default: NPCControlPanel}) => {
            this.npcControlPanel = new NPCControlPanel(this);
        });
    }

    showSiloModal(resources) {
        import('./components/UI/SiloPanel.js').then(({default: SiloPanel}) => {
            SiloPanel.showSiloModal(resources);
        });
    }

    showNPCControls(npc) {
        if (this.npcControlPanel) {
            this.npcControlPanel.showNPCControls(npc);
        }
    }

    cleanupNPCControls() {
        if (this.npcControlPanel) {
            this.npcControlPanel.cleanupNPCControls();
        }
    }
}