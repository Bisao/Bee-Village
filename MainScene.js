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
        this.uiPanels.siloPanel.show(resources);
    }

    showNPCControls(npc) {
        this.uiPanels.npcPanel.show(npc);
    }

    showSettingsPanel() {
        this.uiPanels.settingsPanel.show();
    }

    enablePlayerControl(npc) {
constructor() {
        super({ key: 'MainScene' });
        
        // Core systems
        this.grid = null;
        this.inputManager = null;
        this.resourceSystem = null;

        // Managers
        this.assetManager = null;
        this.buildingManager = null;
        this.uiManager = null;
        this.npcManager = null;
        this.saveManager = null;
        this.movementManager = null;
        this.animationManager = null;
        this.feedbackManager = null;
        this.professionManager = null;
        this.inventoryManager = null;
        this.uiComponents = {};
}
async create() {
        if (!this.textures.exists('tile_grass')) {
            return; // Wait for assets to load
        }

        // Initialize managers
        this.assetManager = new AssetManager(this);
        this.buildingManager = new BuildingManager(this);
        this.uiManager = new UIManager(this);
        this.npcManager = new NPCManager(this);
        this.saveManager = new SaveManager(this);
        this.movementManager = new MovementManager(this);
        this.animationManager = new AnimationManager(this);
        this.feedbackManager = new FeedbackManager(this);
        this.professionManager = new ProfessionManager(this);
        this.inventoryManager = new InventoryManager(this);

        // Initialize core systems

        // Initialize UI components
        const { default: NPCControlPanel } = await import('./components/UI/NPCControlPanel.js');
        const { default: SiloPanel } = await import('./components/UI/SiloPanel.js');

        this.uiComponents.npcPanel = new NPCControlPanel(this);
        this.uiComponents.siloPanel = new SiloPanel(this);
    }