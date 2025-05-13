export default class SaveManager {
    constructor(scene) {
        this.scene = scene;
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

            // Validate and convert building grid
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
            this.scene.showFeedback('Jogo salvo!', true);
        } catch (error) {
            console.error('Error saving game:', error);
            this.scene.showFeedback('Erro ao salvar o jogo', false);
            this.saveEmergencyBackup();
        }
    }

    private showSaveIndicator() {
        const saveIndicator = document.querySelector('.save-indicator');
        if (saveIndicator) {
            saveIndicator.classList.add('saving');
            setTimeout(() => {
                saveIndicator.classList.remove('saving');
            }, 1000);
        }
    }

    private saveEmergencyBackup() {
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

    autoSave() {
        if (!this.scene.farmer || !this.scene.grid) {
            console.warn('Cannot save: game state not fully initialized');
            return;
        }

        try {
            const gameState = {
                buildingGrid: {},
                farmerPosition: {
                    x: this.scene.farmer.gridX,
                    y: this.scene.farmer.gridY
                }
            };

            Object.entries(this.scene.grid.buildingGrid).forEach(([key, value]) => {
                gameState.buildingGrid[key] = {
                    type: value.type,
                    gridX: value.gridX,
                    gridY: value.gridY,
                    buildingType: value.sprite ? value.sprite.texture.key : null
                };
            });

            const saveIndicator = document.querySelector('.save-indicator');
            if (saveIndicator) {
                saveIndicator.classList.add('saving');
                setTimeout(() => {
                    saveIndicator.classList.remove('saving');
                }, 1000);
            }

            localStorage.setItem('gameState', JSON.stringify(gameState));
            console.log('Game saved successfully');
        } catch (error) {
            console.error('Error saving game:', error);
        }
    }
}