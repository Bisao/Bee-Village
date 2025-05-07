placeBuilding(gridX, gridY, worldX, worldY) {
    const flashTile = (x, y) => {
        const tile = this.grid.grid[y][x];
        if (tile) {
            this.tweens.add({
                targets: tile,
                alpha: { from: 1, to: 0.5 },
                yoyo: true,
                duration: 200,
                ease: 'Power2'
            });
        }
    };

    //rest of the placeBuilding function would go here.
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

            // Keep last 3 auto-saves as backup
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

    showFeedback(message, success) {
        const feedback = this.add.text(this.game.config.width / 2, this.game.config.height / 2, message, {
            fontSize: '24px',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 4,
            fill: success ? '#00ff00' : '#ff0000',
            align: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 15, y: 10 },
            borderRadius: 8
        });
        feedback.setOrigin(0.5);
        this.tweens.add({
            targets: feedback,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => feedback.destroy()
        });
    }

    createFarmerAnimations() {
        // Animation configurations
        const animations = {
            'farmer_up': [1, 2, 3, 4],
            'farmer_down': [9, 10, 11, 12],
            'farmer_left': [5, 6, 7, 8],
            'farmer_right': [1, 2, 3, 4]
        };

        // Remove existing animations
        Object.keys(animations).forEach(key => {
            if (this.anims.exists(key)) {
                this.anims.remove(key);
            }
        });

        // Create new animations
        Object.entries(animations).forEach(([key, frames]) => {
            const animFrames = frames.map(i => ({
                key: `farmer${i}`,
                frame: 0,
                duration: 200
            }));

            this.anims.create({
                key: key,
                frames: animFrames,
                frameRate: 8,
                repeat: -1
            });
        });
    }
}