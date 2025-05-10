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

createTopBar() {
        // Criar container da top bar fixo na câmera
        const topBar = this.add.rectangle(0, 0, window.innerWidth, 50, 0x2d2d2d);
        topBar.setOrigin(0, 0);
        topBar.setScrollFactor(0);
        topBar.setDepth(1000);

        // Adicionar texto exemplo
        const villageText = this.add.text(10, 15, '🌻 My Village', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        villageText.setScrollFactor(0);
        villageText.setDepth(1000);

        // Adicionar botão da loja
        const shopButton = this.add.text(window.innerWidth - 100, 15, '🏪', {
            fontSize: '24px',
            color: '#ffffff'
        })
        .setScrollFactor(0)
        .setDepth(2000)
        .setInteractive()
        .setOrigin(0, 0);

        shopButton.on('pointerdown', () => {
            this.shopSystem.openShop();
        });

        shopButton.on('pointerover', () => {
            shopButton.setScale(1.1);
        });

        shopButton.on('pointerout', () => {
            shopButton.setScale(1);
        });

        // Atualizar posição quando a tela for redimensionada
        this.scale.on('resize', (gameSize) => {
            const width = gameSize.width;
            topBar.width = width;
            shopButton.setPosition(width - 100, 15);
        });
    }