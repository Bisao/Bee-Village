import Grid from './components/Grid.js';
import InputManager from './components/InputManager.js';
import BuildingManager from './components/BuildingManager.js';
import UIManager from './components/UI/UIManager.js';
import NPCManager from './components/NPCManager.js';
import SaveManager from './components/SaveManager.js';
import AssetManager from './components/AssetManager.js';
import FeedbackManager from './components/FeedbackManager.js';
import MovementManager from './components/MovementManager.js';
import EnvironmentManager from './components/EnvironmentManager.js';
import MobileManager from './components/MobileManager.js';
import ProfessionManager from './components/ProfessionManager.js';

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
        this.assetManager = new AssetManager(this);
        this.assetManager.loadAssets();

        this.load.on('complete', () => {
            this.game.events.emit('ready');
        });
    }

    create() {
        if (!this.textures.exists('tile_grass')) {
            return;
        }

        // Initialize all managers
        this.grid = new Grid(this, 10, 10);
        this.inputManager = new InputManager(this);
        this.buildingManager = new BuildingManager(this);
        this.uiManager = new UIManager(this);
        this.npcManager = new NPCManager(this);
        this.saveManager = new SaveManager(this);
        this.feedbackManager = new FeedbackManager(this);
        this.movementManager = new MovementManager(this);
        this.environmentManager = new EnvironmentManager(this);
        this.mobileManager = new MobileManager(this);
        this.professionManager = new ProfessionManager(this);

        // Initialize core systems
        this.grid.create();
        this.inputManager.init();
        this.uiManager.setupUIHandlers();
        this.setupUIHandlers();

        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.updatePreview, this);

        // Place initial environment and buildings
        this.environmentManager.placeEnvironmentObjects();
        this.placeEnvironmentObjects();

        // Place initial buildings
        const initialBuildings = [
            { x: 1, y: 1, type: 'lumberHouse' },
            { x: 3, y: 1, type: 'silo' }
        ];

        initialBuildings.forEach(building => {
            const {tileX, tileY} = this.grid.gridToIso(building.x, building.y);
            const worldX = this.cameras.main.centerX + tileX;
            const worldY = this.cameras.main.centerY + tileY;

            this.buildingManager.placeBuilding(building.x, building.y, worldX, worldY, building.type);
        });

        // Define zoom inicial diferente para mobile e desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const initialZoom = isMobile ? 0.8 : 1.5;
        this.cameras.main.setZoom(initialZoom);

        // Setup auto-save
        this.time.addEvent({
            delay: 60000,
            callback: () => this.saveManager.autoSave(),
            loop: true
        });
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
        }

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

    setupUIHandlers() {
        const buildButtons = document.querySelectorAll('.build-button');
        buildButtons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.dataset.building;
                this.startBuildingPlacement(buildingType);
            });
        });
        const saveButton = document.querySelector('.save-button');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveManager.autoSave();
            });
        }

        const clearSaveButton = documentquerySelector('.clear-save-button');
        if (clearSaveButton) {
            clearSaveButton.addEventListener('click', () => {
                localStorage.removeItem('gameState');
                console.log('Save cleared');
            });
        }
    }

    loadAssets() {
        this.load.image('tile_grass', 'attached_assets/tile_grass.png');
        this.load.image('tile_dirt', 'attached_assets/tile_dirt.png');
        this.load.image('tree', 'attached_assets/tree.png');
        this.load.image('rock', 'attached_assets/rock.png');
        this.load.image('lumberHouse', 'attached_assets/lumberHouse.png');
        this.load.image('silo', 'attached_assets/silo.png');
        this.load.image('farmerHouse', 'attached_assets/farmerHouse.png');
        this.load.image('FishermanHouse', 'attached_assets/FishermanHouse.png');
        this.load.image('minerHouse', 'attached_assets/minerHouse.png');

        this.load.image('ui_lumberjack', 'attached_assets/ui_lumberjack.png');
        this.load.image('ui_farmer', 'attached_assets/ui_farmer.png');
        this.load.image('ui_miner', 'attached_assets/ui_miner.png');
        this.load.image('ui_fisherman', 'attached_assets/ui_fisherman.png');

        this.load.image('ui_house', 'attached_assets/ui_house.png');
        this.load.image('ui_silo', 'attached_assets/ui_silo.png');

        this.load.image('farmer1', 'attached_assets/Farmer_1-ezgif.com-resize.png');
        this.load.image('farmer2', 'attached_assets/Farmer_2-ezgif.com-resize.png');
        this.load.image('farmer3', 'attached_assets/Farmer_3-ezgif.com-resize.png');
        this.load.image('farmer4', 'attached_assets/Farmer_4-ezgif.com-resize.png');
        this.load.image('farmer5', 'attached_assets/Farmer_5-ezgif.com-resize.png');
        this.load.image('farmer6', 'attached_assets/Farmer_6-ezgif.com-resize.png');
        this.load.image('farmer7', 'attached_assets/Farmer_7-ezgif.com-resize.png');
        this.load.image('farmer8', 'attached_assets/Farmer_8-ezgif.com-resize.png');
        this.load.image('farmer9', 'attached_assets/Farmer_9-ezgif.com-resize.png');
        this.load.image('farmer10', 'attached_assets/Farmer_10-ezgif.com-resize.png');
        this.load.image('farmer11', 'attached_assets/Farmer_11-ezgif.com-resize.png');
        this.load.image('farmer12', 'attached_assets/Farmer_12-ezgif.com-resize.png');
    }

    handleClick(pointer) {
        if (this.selectedBuilding) {
            const gridX = Math.floor((pointer.worldX - this.cameras.main.centerX) / this.grid.tileWidth);
            const gridY = Math.floor((pointer.worldY - this.cameras.main.centerY) / this.grid.tileHeight);

            if (this.isValidGridPosition(gridX, gridY) && !this.isTileOccupied(gridX, gridY)) {
                const {tileX, tileY} = this.grid.gridToIso(gridX, gridY);
                const worldX = this.cameras.main.centerX + tileX;
                const worldY = this.cameras.main.centerY + tileY;

                this.buildingManager.placeBuilding(gridX, gridY, worldX, worldY, this.selectedBuilding);

                this.cancelBuildingSelection();
            } else {
                console.log("Invalid position for building.");
                this.feedbackManager.showFeedback("Invalid position!", false);
            }
        }
    }

    updatePreview(pointer) {
        if (this.selectedBuilding) {
            const gridX = Math.floor((pointer.worldX - this.cameras.main.centerX) / this.grid.tileWidth);
            const gridY = Math.floor((pointer.worldY - this.cameras.main.centerY) / this.grid.tileHeight);

            if (this.isValidGridPosition(gridX, gridY)) {
                const {tileX, tileY} = this.grid.gridToIso(gridX, gridY);
                const worldX = this.cameras.main.centerX + tileX;
                const worldY = this.cameras.main.centerY + tileY;

                if (!this.previewBuilding) {
                    this.previewBuilding = this.add.sprite(worldX, worldY, this.selectedBuilding);
                    this.previewBuilding.setOrigin(0.5, 1);
                    this.previewBuilding.setAlpha(0.5);
                } else {
                    this.previewBuilding.x = worldX;
                    this.previewBuilding.y = worldY;
                }
            } else {
                if (this.previewBuilding) {
                    this.previewBuilding.destroy();
                    this.previewBuilding = null;
                }
            }
        }
    }

    startBuildingPlacement(buildingType) {
        this.selectedBuilding = buildingType;
    }

    placeBuilding(x, y, worldX, worldY, buildingType) {
        const building = this.add.sprite(worldX, worldY, buildingType);
        building.setOrigin(0.5, 1);
        building.type = 'building';
        building.gridX = x;
        building.gridY = y;

        const key = `${x},${y}`;
        this.grid.buildingGrid[key] = building;
    }

    placeEnvironmentObjects() {
        const treeCount = 10;
        for (let i = 0; i < treeCount; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(0, this.grid.width - 1);
                y = Phaser.Math.Between(0, this.grid.height - 1);
            } while (this.isTileOccupied(x, y));

            const {tileX, tileY} = this.grid.gridToIso(x, y);
            const worldX = this.cameras.main.centerX + tileX;
            const worldY = this.cameras.main.centerY + tileY;

            const tree = this.add.sprite(worldX, worldY, 'tree');
            tree.setOrigin(0.5, 1);
            tree.setDepth(y);

            const key = `${x},${y}`;
            this.grid.buildingGrid[key] = tree;
        }
    }

    showFeedback(text, isGood) {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback');
        feedbackElement.textContent = text;

        if (isGood) {
            feedbackElement.classList.add('good');
        } else {
            feedbackElement.classList.add('bad');
        }

        document.body.appendChild(feedbackElement);
        setTimeout(() => {
            feedbackElement.remove();
        }, 3000);
    }
}