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