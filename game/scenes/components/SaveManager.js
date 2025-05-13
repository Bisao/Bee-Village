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