export default class SaveManager {
    constructor(scene) {
        this.scene = scene;
    }

    saveGame() {
        try {
            const gameState = {
                grid: this.scene.grid.buildingGrid,
                resources: this.scene.resourceSystem.getAllResources(),
                npcs: this.scene.npcManager.getAllNPCs()
            };

            localStorage.setItem('villageGame', JSON.stringify(gameState));
            this.scene.feedbackManager.showFeedback('Jogo salvo com sucesso!', true);
        } catch (error) {
            console.error('Error saving game:', error);
            this.scene.feedbackManager.showFeedback('Erro ao salvar o jogo', false);
        }
    }

    loadGame() {
        try {
            const savedState = localStorage.getItem('villageGame');
            if (!savedState) {
                this.scene.feedbackManager.showFeedback('Nenhum jogo salvo encontrado', false);
                return false;
            }

            const gameState = JSON.parse(savedState);
            this.scene.grid.buildingGrid = gameState.grid;
            this.scene.resourceSystem.setResources(gameState.resources);
            this.scene.npcManager.restoreNPCs(gameState.npcs);

            this.scene.feedbackManager.showFeedback('Jogo carregado com sucesso!', true);
            return true;
        } catch (error) {
            console.error('Error loading game:', error);
            this.scene.feedbackManager.showFeedback('Erro ao carregar o jogo', false);
            return false;
        }
    }

    autoSave() {
        if (!this.scene.farmer || !this.scene.grid) {
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
                    x: this.scene.farmer.gridX,
                    y: this.scene.farmer.gridY
                },
                camera: {
                    zoom: this.scene.cameras.main.zoom,
                    scrollX: this.scene.cameras.main.scrollX,
                    scrollY: this.scene.cameras.main.scrollY
                }
            };

            Object.entries(this.scene.grid.buildingGrid).forEach(([key, value]) => {
                if (!value || !value.gridX || !value.gridY) return;

                gameState.buildingGrid[key] = {
                    type: value.type,
                    gridX: value.gridX,
                    gridY: value.gridY,
                    buildingType: value.sprite?.texture?.key || null
                };
            });

            const backupKey = `gameState_backup_${timestamp}`;
            const backups = JSON.parse(localStorage.getItem('gameStateBackups') || '[]');
            backups.unshift(backupKey);
            while (backups.length > 3) {
                const oldBackup = backups.pop();
                localStorage.removeItem(oldBackup);
            }
            localStorage.setItem('gameStateBackups', JSON.stringify(backups));
            localStorage.setItem(backupKey, JSON.stringify(gameState));
            localStorage.setItem('gameState', JSON.stringify(gameState));

            this.showSaveIndicator();
        } catch (error) {
            console.error('Error saving game:', error);
            this.createEmergencyBackup();
        }
    }

    showSaveIndicator() {
        const saveIndicator = document.querySelector('.save-indicator');
        if (saveIndicator) {
            saveIndicator.classList.add('saving');
            setTimeout(() => {
                saveIndicator.classList.remove('saving');
            }, 1000);
        }
    }

    createEmergencyBackup() {
        try {
            const minimalState = {
                farmerPosition: {
                    x: this.scene.farmer.gridX,
                    y: this.scene.farmer.gridY
                },
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('gameState_emergency', JSON.stringify(minimalState));
        } catch (emergencyError) {
            console.error('Emergency save failed:', emergencyError);
        }
    }
}