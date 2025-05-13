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

            // UI methods moved to UIManager
        } catch (error) {
            console.error('Error saving game:', error);
           // UI methods moved to UIManager

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

    // Resource management moved to ResourceSystem.js

    enablePlayerControl(npc) {