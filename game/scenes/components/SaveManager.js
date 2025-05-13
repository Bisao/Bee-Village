export default class SaveManager {
    constructor(scene) {
        this.scene = scene;
    }

    autoSave() {
        if (!this.scene.farmer) {
            console.warn('Cannot save: game state not fully initialized');
            return;
        }

        try {
            const timestamp = new Date().toISOString();
            const gameState = this.createGameState(timestamp);
            this.saveGameState(gameState, timestamp);
            this.updateBackups(timestamp);
            this.showSaveFeedback();
        } catch (error) {
            console.error('Error saving game:', error);
            this.scene.showFeedback('Erro ao salvar o jogo', false);
            this.createEmergencyBackup();
        }
    }

    createGameState(timestamp) {
        return {
            version: '1.0',
            timestamp: timestamp,
            buildingGrid: this.serializeBuildingGrid(),
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
    }

    serializeBuildingGrid() {
        const serializedGrid = {};
        Object.entries(this.scene.grid.buildingGrid).forEach(([key, value]) => {
            if (!value || !value.gridX || !value.gridY) return;
            serializedGrid[key] = {
                type: value.type,
                gridX: value.gridX,
                gridY: value.gridY,
                buildingType: value.sprite?.texture?.key || null
            };
        });
        return serializedGrid;
    }

    saveGameState(gameState, timestamp) {
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    updateBackups(timestamp) {
        const backupKey = `gameState_backup_${timestamp}`;
        const backups = JSON.parse(localStorage.getItem('gameStateBackups') || '[]');
        backups.unshift(backupKey);
        while (backups.length > 3) {
            const oldBackup = backups.pop();
            localStorage.removeItem(oldBackup);
        }
        localStorage.setItem('gameStateBackups', JSON.stringify(backups));
    }

    showSaveFeedback() {
        const saveIndicator = document.querySelector('.save-indicator');
        if (saveIndicator) {
            saveIndicator.classList.add('saving');
            setTimeout(() => {
                saveIndicator.classList.remove('saving');
            }, 1000);
        }
        this.scene.showFeedback('Jogo salvo!', true);
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