` tags.

```xml
<replit_final_file>
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.grid = null;
        this.selectedBuilding = null;
        this.farmer = null;
    }

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

        const key = `${gridX},${gridY}`;
        this.grid.buildingGrid[key] = {
            sprite: building,
            type: 'building',
            buildingType: this.selectedBuilding,
            gridX: gridX,
            gridY: gridY
        };

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

            Object.entries(this.grid.buildingGrid).forEach(([key, value]) => {
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

    showSiloModal(resources) {
        const existingModal = document.querySelector('.silo-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'silo-modal';
        modal.innerHTML = `
            <div class="silo-content">
                <div class="silo-header">
                    <h2 class="silo-title">🏗️ Armazém</h2>
                    <button class="close-silo-btn">✕</button>
                </div>
                <div class="resources-grid">
                    ${resources.map(res => `
                        <div class="resource-item">
                            <div class="resource-icon">${res.icon}</div>
                            <div class="resource-info">
                                <div class="resource-name">${res.name}</div>
                                <div class="resource-progress">
                                    <div class="progress-bar" style="width: ${(res.amount / 100) * 100}%"></div>
                                </div>
                                <div class="resource-amount">${res.amount}/100</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.close-silo-btn');
        closeButton.onclick = () => modal.remove();

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }
}

export default MainScene;