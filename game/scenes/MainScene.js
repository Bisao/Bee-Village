import Grid from '../scenes/components/Grid.js';
import InputManager from '../scenes/components/InputManager.js';
import LumberSystem from '../scenes/components/LumberSystem.js';
import ResourceSystem from '../scenes/components/ResourceSystem.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.selectedBuilding = null;
        this.previewBuilding = null;
        this.resourceSystem = null;

        // Emoji mapping for professions
        this.professionEmojis = {
            'Farmer': '🥕',
            'Miner': '⛏️',
            'Fisher': '🎣',
            'Lumberjack': '🪓',
            'Villager': '👤'
        };
        this.professionNames = {
            farmerHouse: {
                prefix: 'Farmer',
                names: ['John', 'Peter', 'Mary', 'Lucas', 'Emma', 'Sofia', 'Miguel', 'Julia']
            },
            FishermanHouse: {
                prefix: 'Fisher',
                names: ['Jack', 'Tom', 'Nina', 'Marco', 'Ana', 'Leo', 'Luna', 'Kai']
            },
            minerHouse: {
                prefix: 'Miner',
                names: ['Max', 'Sam', 'Alex', 'Cole', 'Ruby', 'Jade', 'Rocky', 'Crystal']
            },
            lumberHouse: {
                prefix: 'Lumberjack',
                names: ['Paul', 'Jack', 'Woody', 'Axel', 'Oak', 'Forest', 'Timber', 'Cedar']
            }
        };
    }

    preload() {
        this.loadAssets();
        this.load.on('complete', () => {
            this.game.events.emit('ready');
        });
    }

    create() {
        if (!this.textures.exists('tile_grass')) {
            return; // Wait for assets to load
        }
        this.grid = new Grid(this, 10, 10);
        this.inputManager = new InputManager(this);
        this.resourceSystem = new ResourceSystem(this);

        this.grid.create();
        this.inputManager.init();
        this.setupUIHandlers();

        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.updatePreview, this);

        this.placeEnvironmentObjects();

        // Posiciona a casa do lenhador inicial
        this.placeBuilding(1, 1, 
            this.cameras.main.centerX + this.grid.gridToIso(1, 1).tileX,
            this.cameras.main.centerY + this.grid.gridToIso(1, 1).tileY,
            'lumberHouse'
        );

        // Posiciona o silo inicial
        this.placeBuilding(3, 1,
            this.cameras.main.centerX + this.grid.gridToIso(3, 1).tileX,
            this.cameras.main.centerY + this.grid.gridToIso(3, 1).tileY,
            'silo'
        );

        // Adicionar casa de lenhador inicial
        this.placeBuilding(1, 1, 
            this.cameras.main.centerX + this.grid.gridToIso(1, 1).tileX,
            this.cameras.main.centerY + this.grid.gridToIso(1, 1).tileY,
            'lumberHouse'
        );

        // Adicionar silo inicial
        this.placeBuilding(3, 1,
            this.cameras.main.centerX + this.grid.gridToIso(3, 1).tileX,
            this.cameras.main.centerY + this.grid.gridToIso(3, 1).tileY,
            'silo'
        );

        // Define zoom inicial diferente para mobile e desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const initialZoom = isMobile ? 0.8 : 1.5;
        this.cameras.main.setZoom(initialZoom);
    }

    createFarmer() {
        if (this.farmerCreated) return;
        this.farmerCreated = true;

        const frames = [];
        for (let i = 1; i <= 12; i++) {
            const key = `farmer${i}`;
            if (!this.textures.exists(key)) {
                this.load.image(key, `attached_assets/Farmer_${i}-ezgif.com-resize.png`);
            }
            frames.push({ key });
        }

        this.load.once('complete', () => {
            this.anims.create({
                key: 'farmer_walk',
                frames: frames,
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: 'farmer_up',
                frames: [
                    { key: 'farmer1' },
                    { key: 'farmer2' },
                    { key: 'farmer3' },
                    { key: 'farmer4' }
                ],
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: 'farmer_down',
                frames: [
                    { key: 'farmer9' },
                    { key: 'farmer10' },
                    { key: 'farmer11' },
                    { key: 'farmer12' }
                ],
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: 'farmer_left',
                frames: [
                    { key: 'farmer5' },
                    { key: 'farmer6' },
                    { key: 'farmer7' },
                    { key: 'farmer8' }
                ],
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: 'farmer_right',
                frames: [
                    { key: 'farmer1' },
                    { key: 'farmer2' },
                    { key: 'farmer3' },
                    { key: 'farmer4' }
                ],
                frameRate: 8,
                repeat: -1
            });

            const startX = Math.floor(this.grid.width / 2);
            const startY = Math.floor(this.grid.height / 2);
            const {tileX, tileY} = this.grid.gridToIso(startX, startY);

            this.farmer = this.add.sprite(
                this.cameras.main.centerX + tileX,
                this.cameras.main.centerY + tileY - 16,
                'farmer1'
            );

            this.farmer.gridX = startX;
            this.farmer.gridY = startY;
            this.farmer.setScale(0.8);
            this.farmer.setDepth(startY + 1);

            this.cameras.main.startFollow(this.farmer, true, 0.5, 0.5);

            this.keys = this.input.keyboard.addKeys({
                w: Phaser.Input.Keyboard.KeyCodes.W,
                a: Phaser.Input.Keyboard.KeyCodes.A,
                s: Phaser.Input.Keyboard.KeyCodes.S,
                d: Phaser.Input.Keyboard.KeyCodes.D
            });

            this.input.keyboard.on('keydown', this.handleKeyDown, this);

            if ('ontouchstart' in window) {
                const buttons = {
                    'mobile-up': 'W',
                    'mobile-down': 'S', 
                    'mobile-left': 'A',
                    'mobile-right': 'D'
                };

                Object.entries(buttons).forEach(([className, key]) => {
                    const button = document.querySelector(`.${className}`);
                    if (button) {
                        button.addEventListener('touchstart', (e) => {
                            e.preventDefault();
                            this.keys[key.toLowerCase()].isDown = true;
                        });
                        button.addEventListener('touchend', (e) => {
                            e.preventDefault();
                            this.keys[key.toLowerCase()].isDown = false;
                        });
                    }
                });
            }
        });

        this.load.start();
    }

    update() {
        if (!this.farmer || this.farmer.isMoving) return;

        let direction = null;
        let animKey = null;

        if (this.keys.w.isDown) {
            direction = { x: 0, y: -1 };
            animKey = 'farmer_up';
        } else if (this.keys.s.isDown) {
            direction = { x: 0, y: 1 };
            animKey = 'farmer_down';
        } else if (this.keys.a.isDown) {
            direction = { x: -1, y: 0 };
            animKey = 'farmer_left';
        } else if (this.keys.d.isDown) {
            direction = { x: 1, y: 0 };
            animKey = 'farmer_right';
        }

        if (direction) {
            const newX = this.farmer.gridX + direction.x;
            const newY = this.farmer.gridY + direction.y;

            if (this.grid.isValidPosition(newX, newY) && !this.isTileOccupied(newX, newY)) {
                this.moveFarmer(direction, animKey);
            }
        }
    }

    handleKeyDown(event) {
        // This method is now only used for mobile controls
        if (this.farmer.isMoving) return;

        let direction = null;
        let animKey = null;

        switch(event.key.toLowerCase()) {
            case 'w':
                direction = { x: 0, y: -1 };
                animKey = 'farmer_up';
                break;
            case 's':
                direction = { x: 0, y: 1 };
                animKey = 'farmer_down';
                break;
            case 'a':
                direction = { x: -1, y: 0 };
                animKey = 'farmer_left';
                break;
            case 'd':
                direction = { x: 1, y: 0 };
                animKey = 'farmer_right';
                break;
        }

        if (direction) {
            const newX = this.farmer.gridX + direction.x;
            const newY = this.farmer.gridY + direction.y;

            if (this.grid.isValidPosition(newX, newY) && !this.isTileOccupied(newX, newY)) {
                this.moveFarmer(direction, animKey);
            }
        }
    }

    moveFarmer(direction, animKey) {
        const newX = this.farmer.gridX + direction.x;
        const newY = this.farmer.gridY + direction.y;
        const {tileX, tileY} = this.grid.gridToIso(newX, newY);

        this.farmer.isMoving = true;
        this.farmer.play(animKey);

        this.tweens.add({
            targets: this.farmer,
            x: this.cameras.main.centerX + tileX,
            y: this.cameras.main.centerY + tileY - 16,
            duration: 600,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                this.farmer.gridX = newX;
                this.farmer.gridY = newY;
                this.farmer.setDepth(newY + 1);
                this.farmer.isMoving = false;
                this.farmer.stop();
                this.events.emit('farmerMoved');
            }
        });
    }

    isTileOccupied(x, y) {
        const key = `${x},${y}`;
        const object = this.grid.buildingGrid[key];
        // Retorna true apenas se houver uma construção no tile
        return object && object.type === 'building';
    }

    getAvailableDirections(fromX, fromY) {
        const directions = [
            { x: 1, y: 0 },   // direita
            { x: -1, y: 0 },  // esquerda
            { x: 0, y: 1 },   // baixo
            { x: 0, y: -1 }   // cima
        ];

        return directions.filter(dir => {
            const newX = fromX + dir.x;
            const newY = fromY + dir.y;
            return this.grid.isValidPosition(newX, newY) && !this.isTileOccupied(newX, newY);
        });
    }

    // Métodos de construção movidos para BuildingManager

    isValidGridPosition(x, y) {
        return this.grid.isValidPosition(x, y);
    }

    cancelBuildingSelection() {
        this.selectedBuilding = null;
        if (this.previewBuilding) {
            this.previewBuilding.destroy();
            this.previewBuilding = null;
        }
    }

    autoSave() {
        if (!this.farmer) return;

        try {
            const gameState = {
                buildingGrid: {},
                farmerPosition: {
                    x: this.farmer.gridX,
                    y: this.farmer.gridY
                }
            };

            // Convert building grid to a serializable format
            Object.entries(this.grid.buildingGrid).forEach(([key, value]) => {
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

    clearTileHighlights() {
        this.grid.grid.flat().forEach(tile => {
            tile.clearTint();
        });
    }

    updateTileHighlights() {
        this.grid.grid.flat().forEach(tile => {
            const gridPosition = tile.data;
            const key = `${gridPosition.gridX},${gridPosition.gridY}`;

            if (this.grid.buildingGrid[key]) {
                // Occupied tiles - Red tint
                tile.setTint(0xFF0000);
            } else if (this.grid.isValidPosition(gridPosition.gridX, gridPosition.gridY)) {
                // Available tiles - Green tint
                tile.setTint(0x00FF00);
            } else {
                // Invalid tiles - Red tint
                tile.setTint(0xFF0000);
            }
        });
    }
    async createFarmerNPC(houseX, houseY, worldX, worldY) {
        // Import BaseNPC if not already imported
        return import('./components/BaseNPC.js').then(({ default: BaseNPC }) => {
            // Get building type and name data
            const buildingKey = `${houseX},${houseY}`;
            const buildingType = this.grid.buildingGrid[buildingKey]?.buildingType;
            const nameData = this.professionNames[buildingType];
            const randomName = nameData ? this.getRandomName(buildingType) : 'Unknown';

            // Create NPC configuration
            const npcConfig = {
                name: randomName,
                profession: nameData?.prefix || 'Villager',
                emoji: this.getProfessionEmoji(nameData?.prefix),
                spritesheet: 'farmer',
                scale: 0.8,
                movementDelay: 2000,
                tools: this.getToolsForProfession(nameData?.prefix), // Adiciona as ferramentas
                level: 1,
                xp: 0,
                maxXp: 100
            };

            // Create NPC instance
            const npc = new BaseNPC(this, houseX, houseY, npcConfig);

            // Store NPC reference in building grid
            this.grid.buildingGrid[buildingKey].npc = npc;

            // Adiciona interatividade à casa
            const house = this.grid.buildingGrid[buildingKey].sprite;
            if (house) {
                house.setInteractive();
                house.on('pointerdown', () => this.showNPCControls(npc));
            }
            return npc;
        });
    }

    startNPCMovement(npc) {
        if (!npc.isAutonomous) return;

        // First step down if possible
        const firstStep = () => {
            const newY = npc.gridY + 1;
            if (this.grid.isValidPosition(npc.gridX, newY) && !this.isTileOccupied(npc.gridX, newY)) {
                this.moveNPCTo(npc, npc.gridX, newY);
            }
        };

        // Execute initial down step
        firstStep();

        const moveNPC = () => {
            if (!npc.isAutonomous || npc.isMoving) return;

            const directions = this.getAvailableDirections(npc.gridX, npc.gridY);
            if (directions.length === 0) return;

            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            this.moveNPCTo(npc, npc.gridX + randomDir.x, npc.gridY + randomDir.y);
        };

        this.time.addEvent({
            delay: 2000,
            callback: moveNPC,
            loop: true
        });
    }

    moveNPCTo(npc, newX, newY) {
        if (npc.isMoving) return;

        const {tileX, tileY} = this.grid.gridToIso(newX, newY);
        npc.isMoving = true;

        // Determina direção da animação
        let animKey = 'farmer_right';
        if (newY < npc.gridY) animKey = 'farmer_up';
        else if (newY > npc.gridY) animKey = 'farmer_down';
        else if (newX < npc.gridX) animKey = 'farmer_left';

        // Verifica e toca a animação
        if (this.anims.exists(animKey)) {
            npc.sprite.play(animKey, true); // true força o reinício da animação
        } else {
            console.warn(`Animation ${animKey} not found`);
            // Usa um frame estático como fallback
            npc.sprite.setTexture('farmer1');
        }

        const scene = this;
        this.tweens.add({
            targets: [npc.sprite, npc.nameText],
            x: this.cameras.main.centerX + tileX,
            y: function (target, key, value, targetIndex) {
                const baseY = scene.cameras.main.centerY + tileY;
                return targetIndex === 0 ? baseY - 32 : baseY - 64;
            },
            duration: 600,
            ease: 'Linear',
            onComplete: () => {
                npc.gridX = newX;
                npc.gridY = newY;
                npc.sprite.setDepth(newY + 2);
                npc.isMoving = false;
                npc.sprite.stop();
            }
        });
    }

    showNPCControls(npc) {
        // Cleanup previous NPC controls
        this.cleanupNPCControls();

        const modal = document.createElement('div');
        modal.className ='npc-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-button">✕</button>
                <div class="npc-header">
                    <div class="npc-avatar">
                        ${npc.config.emoji}
                    </div>
                    <div class="npc-info">
                        <div class="npc-name-row">
                            <h3>${npc.config.name}</h3>
                            <button class="camera-follow-btn">👁️ Seguir</button>
                        </div>
                        <p class="npc-profession">${npc.config.profession}</p>
                        <div class="npc-level-info">
                            <span class="level-text">Nível ${npc.config.level}</span>
                            <div class="xp-bar">
                                <div class="xp-progress" style="width: ${(npc.config.xp / npc.config.maxXp) * 100}%"></div>
                            </div>
                            <span class="xp-text">${npc.config.xp}/${npc.config.maxXp} XP</span>
                        </div>
                    </div>
                </div>

                <div class="control-buttons">
                    <button class="control-btn ${npc.isAutonomous ? 'active' : ''}" id="autonomous">
                        🤖 Modo Autônomo
                    </button>
                    <button class="control-btn ${!npc.isAutonomous ? 'active' : ''}" id="controlled">
                        🕹️ Modo Controlado
                    </button>
                </div>

                <div class="mode-info">
                    <p class="autonomous-info ${npc.isAutonomous ? 'visible' : ''}">
                        🔄 NPC se move livremente
                    </p>
                    <p class="controlled-info ${!npc.isAutonomous ? 'visible' : ''}">
                        📱 Use WASD ou controles mobile
                    </p>
                </div>

                <div class="modal-tabs">
                    <button class="modal-tab active" data-tab="inventory">Inventário</button>
                    <button class="modal-tab" data-tab="jobs">Trabalhos</button>
                </div>

                <div class="tab-panel active" id="inventory-panel">
                    <div class="npc-inventory">
                        ${npc.config.tools.map(tool => `
                            <div class="tool-slot">
                                <div class="tool-emoji">${tool.emoji}</div>
                                <div class="tool-name">${tool.name}</div>
                                <div class="tool-description">${tool.description}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="storage-grid">
                        ${Array(4).fill().map((_, i) => `
                            <div class="storage-slot">
                                <div class="storage-icon">${npc.config.profession === 'Lumberjack' ? '🌳' : 
                                    npc.config.profession === 'Farmer' ? '🌾' :
                                    npc.config.profession === 'Miner' ? '⛏️' : '🐟'}</div>
                                <div class="storage-amount">${i < (npc.inventory[npc.config.profession === 'Lumberjack' ? 'wood' : 
                                    npc.config.profession === 'Farmer' ? 'wheat' :
                                    npc.config.profession === 'Miner' ? 'ore' : 'fish'] || 0) ? '1' : '0'}/1</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tab-panel" id="jobs-panel">
                    <div class="jobs-list">
                        ${this.getAvailableJobs(npc).map(job => `
                            <div class="job-option ${npc.currentJob === job.id ? 'active' : ''}" data-job="${job.id}">
                                <div class="job-icon">${job.icon}</div>
                                <div class="job-info">
                                    <div class="job-name">${job.name}</div>
                                    <div class="job-description">${job.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Adiciona manipuladores de eventos do trabalho
        modal.querySelectorAll('.job-option').forEach(option => {
            option.addEventListener('click', () => {
                const jobId = option.dataset.job;
                if (jobId === 'lumber') {
                    if (!npc.lumberSystem) {
                        npc.lumberSystem = new LumberSystem(this);
                    }
                    npc.isAutonomous = false;
                    npc.currentJob = 'lumber';
                    npc.config.emoji = '🪓';
                    npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                    npc.lumberSystem.startWorking(npc);
                    modal.remove();

                    console.log('Iniciando trabalho de lenhador:', npc.config.name);
                }
            });
        });

        // Adiciona manipuladores de eventos para as abas
        modal.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove a classe 'active' de todas as abas e painéis
                modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

                // Adiciona a classe 'active' à aba clicada
                tab.classList.add('active');

                // Mostra o painel correspondente
                const tabId = tab.dataset.tab;
                document.getElementById(`${tabId}-panel`).classList.add('active');
            });
        });

        modal.querySelector('#autonomous').onclick = () => {
            // Transição suave da câmera
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 1.5,
                duration: 500,ease: 'Power2',
                onComplete: () => {
                    npc.isAutonomous = true;
                    this.cameras.main.stopFollow();
                    this.startNPCMovement(npc);
                    // Hide controls panel on mobile
                    if (this.inputManager.isMobile) {
                        document.getElementById('controls-panel').style.display = 'none';
                    }
                }
            });
            this.showFeedback(`${npc.config.name} está em modo autônomo`, true);
            modal.remove();
        };

        modal.querySelector('#controlled').onclick = () => {
            npc.isAutonomous = false;
            this.currentControlledNPC = npc;
            // Make camera follow the NPC
            this.cameras.main.startFollow(npc.sprite, true, 0.08, 0.08);
            this.enablePlayerControl(npc);
            // Show controls panel on mobile
            const controlsPanel = document.getElementById('controls-panel');
            if (this.inputManager.isMobile && controlsPanel) {
                controlsPanel.style.display = 'flex';
                controlsPanel.style.zIndex = '2000';
            }
            modal.remove();
        };

        // Configure close button
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => {
            modal.remove();
        };

        // Configure camera follow button
        const cameraButton = modal.querySelector('.camera-follow-btn');
        cameraButton.onclick = () => {
            this.cameras.main.startFollow(npc.sprite, true);
            modal.remove();

            // Add click handler to stop following
            const clickHandler = () => {
                this.cameras.main.stopFollow();
                this.input.off('pointerdown', clickHandler);
            };
            this.input.on('pointerdown', clickHandler);
        };

        // Close on clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    cleanupNPCControls() {
        if (this.currentControlledNPC) {
            const previousNPC = this.currentControlledNPC;

            // Reset NPC state
            previousNPC.isAutonomous = true;

            // Clear existing movement timer if exists
            if (previousNPC.movementTimer) {
                previousNPC.movementTimer.remove();
            }

            // Remove specific NPC's controls and update handler
            if (previousNPC.controls) {
                Object.values(previousNPC.controls).forEach(key => key.destroy());
                previousNPC.controls = null;
            }
            if (previousNPC.updateHandler) {
                this.events.off('update', previousNPC.updateHandler);
                previousNPC.updateHandler = null;
            }

            // Clear reference before starting movement
            this.currentControlledNPC = null;

            // Start autonomous movement again after a short delay
            this.time.delayedCall(100, () => {
                this.startNPCMovement(previousNPC);
            });
        }
    }

    getProfessionEmoji(profession) {
        return this.professionEmojis[profession] || '👤';
    }

    getRandomName(buildingType) {
        const nameData = this.professionNames[buildingType];
        if (!nameData || !nameData.names || nameData.names.length === 0) {
            console.warn(`No names available for building type: ${buildingType}`);
            return 'Unknown';
        }

        // Get used names for this profession
        if (!this.usedNames) this.usedNames = {};
        if (!this.usedNames[buildingType]) this.usedNames[buildingType] = new Set();

        // Filter available names
        const availableNames = nameData.names.filter(name => 
            !this.usedNames[buildingType].has(name)
        );

        // If all names are used, reset the used names
        if (availableNames.length === 0) {
            this.usedNames[buildingType].clear();
            return this.getRandomName(buildingType);
        }

        // Get random name and mark as used
        const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
        this.usedNames[buildingType].add(randomName);
        return randomName;
    }

    enablePlayerControl(npc) {
        // Remove previous keyboard listeners if they exist
        this.input.keyboard.removeAllListeners('keydown');

        // Create unique controls for this NPC
        npc.controls = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Mobile controls
        if (this.inputManager.isMobile) {
            const buttons = {
                'mobile-up': 'w',
                'mobile-down': 's',
                'mobile-left': 'a',
                'mobile-right': 'd'
            };

            // Remove existing mobile controls if any
            Object.keys(buttons).forEach(className => {
                const button = document.querySelector(`.${className}`);
                if (button) {
                    button.replaceWith(button.cloneNode(true));
                }
            });

            // Add new mobile controls for this NPC
            Object.entries(buttons).forEach(([className, key]) => {
                const button = document.querySelector(`.${className}`);
                if (button) {
                    button.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        if (this.currentControlledNPC === npc) {
                            npc.controls[key].isDown = true;
                        }
                    });
                    button.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        if (this.currentControlledNPC === npc) {
                            npc.controls[key].isDown = false;
                        }
                    });
                }
            });
        }

        // Create unique update handler for this NPC
        npc.updateHandler = () => {
            if (!npc || npc.isMoving || npc.isAutonomous || this.currentControlledNPC !== npc) return;

            let newX = npc.gridX;
            let newY = npc.gridY;

            if (npc.controls.w.isDown) newY--;
            else if (npc.controls.s.isDown) newY++;
            else if (npc.controls.a.isDown) newX--;
            else if (npc.controls.d.isDown) newX++;

            if (newX !== npc.gridX || newY !== npc.gridY) {
                if (this.grid.isValidPosition(newX, newY) && !this.isTileOccupied(newX, newY)) {
                    this.moveNPCTo(npc, newX, newY);
                }
            }
        };

        // Add update handler
        this.events.on('update', npc.updateHandler);
    }

    getToolsForProfession(profession) {
        switch (profession) {
            case 'Farmer':
                return [
                    { name: 'Pá', emoji: '🚜', description: 'Usada para arar a terra.' },
                    { name: 'Semente', emoji: '🌱', description: 'Usada para plantar.' }
                ];
            case 'Miner':
                return [
                    { name: 'Picareta', emoji: '⛏️', description: 'Usada para minerar.' },
                    { name: 'Lanterna', emoji: '🔦', description: 'Ilumina áreas escuras.' }
                ];
            case 'Fisher':
                return [
                    { name: 'Vara de pesca', emoji: '🎣', description: 'Usada para pescar.' },
                    { name: 'Rede', emoji: '🕸️', description: 'Captura peixes em massa.' }
                ];
            case 'Lumberjack':
                return [
                    { name: 'Machado', emoji: '🪓', description: 'Usado para cortar árvores.' },
                    { name: 'Serra', emoji: '🪚', description: 'Corta madeira mais rápido.' }
                ];
            default:
                return [];
        }
    }

    getAvailableJobs(npc) {
        const jobs = [];

        // Trabalho básico para todos
        jobs.push({ id: 'idle', name: 'Descanso', icon: '☕', description: 'Não faz nada.' });

        // Trabalhos específicos por profissão
        if (npc.config.profession === 'Lumberjack') {
            jobs.push({ 
                id: 'lumber', 
                name: 'Cortar Madeira', 
                icon: '🪓', 
                description: 'Corta árvores e coleta madeira.' 
            });
        }```python

        return jobs;
    }

    showSiloModal(resources) {
        const existingModal = document.querySelector('.silo-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'silo-modal';
        modal.innerHTML = `
            <div class="silo-content">
                <div class="silo-header">
                    <h2 class="silo-title">🏗️ Armazém de Recursos</h2>
                    <button class="close-button">✕</button>
                </div>
                <div class="resources-grid">
                    <div class="resource-category">
                        <h3>🪓 Recursos de Madeira</h3>
                        <div class="resource-item">
                            <div class="resource-icon">🌳</div>
                            <div class="resource-info">
                                <div class="resource-name">Toras de Madeira</div>
                            <div class="resource-amount">${resources.find(r => r.name === 'Madeira')?.amount || 0}</div>
                        </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.find(r => r.name === 'Madeira')?.amount || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="resource-category">
                        <h3>🌾 Recursos Agrícolas</h3>
                        <div class="resource-item">
                            <div class="resource-icon">🌾</div>
                            <div class="resource-info">
                                <div class="resource-name">Trigo</div>
                                <div class="resource-amount">${resources.find(r => r.name === 'Trigo')?.amount || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.find(r => r.name === 'Trigo')?.amount || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="resource-category">
                        <h3>⛏️ Recursos Minerais</h3>
                        <div class="resource-item">
                            <div class="resource-icon">⛏️</div>
                            <div class="resource-info">
                                <div class="resource-name">Minério</div>
                                <div class="resource-amount">${resources.find(r => r.name === 'Minério')?.amount || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.find(r => r.name === 'Minério')?.amount || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => {
            modal.remove();
        };
    }
}