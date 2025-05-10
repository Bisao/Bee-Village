import Grid from './components/Grid.js';
import InputManager from './components/InputManager.js';
import ShopSystem from './components/ShopSystem.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.shopSystem = null;
        this.selectedBuilding = null;
        this.previewBuilding = null;

        // Emoji mapping for professions
        this.professionEmojis = {
            'Farmer': '🥕',
            'Miner': '⛏️',
            'Fisher': '🎣',
            'Villager': '👤'
        };
        this.professionNames = {
            farmerHouse: {
                prefix: 'Farmer',
                names: ['John', 'Peter', 'Mary', 'Lucas', 'Emma', 'Sofia', 'Miguel', 'Julia']
            },
            fishermanHouse: {
                prefix: 'Fisher',
                names: ['Jack', 'Tom', 'Nina', 'Marco', 'Ana', 'Leo', 'Luna', 'Kai']
            },
            minerHouse: {
                prefix: 'Miner',
                names: ['Max', 'Sam', 'Alex', 'Cole', 'Ruby', 'Jade', 'Rocky', 'Crystal']
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
        console.log('GameScene iniciada');
        this.eventCleanupList = new Set();
        this.shopSystem = new ShopSystem(this);
        
        // Cleanup no shutdown da cena
        this.events.on('shutdown', this.cleanupEvents, this);
        if (!this.textures.exists('tile_grass')) {
            return; // Wait for assets to load
        }
        this.grid = new Grid(this, 10, 10);
        this.inputManager = new InputManager(this);

        this.grid.create();
        this.inputManager.init();
        this.setupUIHandlers();

        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.updatePreview, this);

        this.placeEnvironmentObjects();

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

    updatePreview = (pointer) => {
        if (!this.selectedBuilding) {
            if (this.previewBuilding) {
                this.previewBuilding.destroy();
                this.previewBuilding = null;
            }
            this.clearTileHighlights();
            return;
        }

        // Update tile highlights
        this.updateTileHighlights();

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const hoveredTile = this.grid.grid.flat().find(tile => {
            const bounds = new Phaser.Geom.Rectangle(
                tile.x - tile.displayWidth / 2,
                tile.y - tile.displayHeight / 2,
                tile.displayWidth,
                tile.displayHeight
            );
            return bounds.contains(worldPoint.x, worldPoint.y);
        });

        if (hoveredTile) {
            const gridPosition = hoveredTile.data;
            const {tileX, tileY} = this.grid.gridToIso(gridPosition.gridX, gridPosition.gridY);
            const worldX = this.cameras.main.centerX + tileX;
            const worldY = this.cameras.main.centerY + tileY;

            if (!this.previewBuilding) {
                this.previewBuilding = this.add.sprite(
                    worldX,
                    worldY,
                    this.selectedBuilding
                );
                const tileScale = 1.4;
                const scale = (this.grid.tileWidth * tileScale) / this.previewBuilding.width;
                this.previewBuilding.setScale(scale);
                this.previewBuilding.setOrigin(0.5, 0.75);
                this.previewBuilding.setAlpha(0.6);
            } else {
                this.previewBuilding.setPosition(worldX, worldY);
            }
            // Atualiza a profundidade do preview para garantir que ele fique visível
            this.previewBuilding.setDepth(1000);
            this.previewBuilding.setDepth(gridPosition.gridY + 1);
        }
    }

    /**
     * Carrega todos os assets do jogo
     * @method loadAssets
     * @private
     */
    loadAssets() {
        // Cache de texturas para otimização
        if (this.textures.exists('tile_grass')) return;

        // Load farmer sprites
        for (let i = 1; i <= 12; i++) {
            this.load.image(`farmer${i}`, `attached_assets/Farmer_${i}-ezgif.com-resize.png`);
        }

        // Load tiles
        const tiles = [
            'tile_grass',
            'tile_grass_2',
            'tile_grass_2_flowers',
            'tile_grass_3_flowers'
        ];

        tiles.forEach(tile => {
            this.load.image(tile, `game/assets/tiles/${tile}.png`);
        });

        // Load rocks
        const rocks = [
            { key: 'rock_small', path: 'game/assets/rocks/small_rock.png' },
            { key: 'rock_medium', path: 'game/assets/rocks/2_rock.png' },
            { key: 'rock_large', path: 'game/assets/rocks/big_rock.png' }
        ];

        rocks.forEach(rock => {
            this.load.image(rock.key, rock.path);
        });

        // Load trees
        const trees = [
            { key: 'tree_simple', path: 'game/assets/trees/tree_simple.png' },
            { key: 'tree_pine', path: 'game/assets/trees/tree_pine.png' },
            { key: 'tree_fruit', path: 'game/assets/trees/tree_fruit.png' },
            { key: 'tree_autumn', path: 'game/assets/trees/tree_autumn.png' }
        ];

        trees.forEach(tree => {
            this.load.image(tree.key, tree.path);
        });

        // Load buildings
        const buildings = [
            'chickenHouse|ChickenHouse',
            'cowHouse|CowHouse', 
            'farmerHouse|FarmerHouse',
            'minerHouse|MinerHouse',
            'pigHouse|PigHouse',
            'fishermanHouse|fishermanHouse'
        ];

        buildings.forEach(building => {
            const [key, filename] = building.split('|');
            this.load.image(key, `game/assets/buildings/${filename}.png`);
        });
    }

    setupUIHandlers() {
        const isMobile = this.inputManager.isMobile;

        if (isMobile) {
            import('./components/UI/MobileUI.js').then(module => {
                const MobileUI = module.default;
                this.ui = new MobileUI(this);
                this.ui.createUI();
            });
        } else {
            import('./components/UI/DesktopUI.js').then(module => {
                const DesktopUI = module.default;
                this.ui = new DesktopUI(this);
                this.ui.createUI();
            });
        }

        // Add toggle panel functionality
        const toggleButton = document.getElementById('toggleStructures');
        const sidePanel = document.getElementById('side-panel');

        if (toggleButton && sidePanel) {
            toggleButton.addEventListener('click', () => {
                const isVisible = sidePanel.style.display === 'flex';
                sidePanel.style.display = isVisible ? 'none' : 'flex';
                if (!isVisible) {
                    this.clearBuildingSelection();
                }
            });
        }
    }

    placeEnvironmentObjects() {
        this.placeRocks();
        this.placeTrees();
    }

    placeRocks() {
        const rockTypes = ['rock_small', 'rock_medium', 'rock_large'];
        this.placeObjects(rockTypes, 8, 'rock');
    }

    placeTrees() {
        const treeTypes = ['tree_simple', 'tree_pine', 'tree_fruit', 'tree_autumn'];
        this.placeObjects(treeTypes, 15, 'tree');
    }

    placeObjects(types, count, objectType) {
        let placed = 0;
        while (placed < count) {
            const randomX = Math.floor(Math.random() * this.grid.width);
            const randomY = Math.floor(Math.random() * this.grid.height);
            const key = `${randomX},${randomY}`;

            if (this.grid.buildingGrid[key]) continue;

            try {
                const randomType = types[Math.floor(Math.random() * types.length)];
                const {tileX, tileY} = this.grid.gridToIso(randomX, randomY);

                const object = this.add.image(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY - (this.grid.tileHeight / 4),
                    randomType
                );

                object.setDepth(randomY + 1);
                const scale = (this.grid.tileWidth * (objectType === 'tree' ? 1.8 : 0.8)) / Math.max(object.width, 1);
                object.setScale(scale);
                object.setOrigin(0.5, 0.8);

                this.grid.buildingGrid[key] = {
                    sprite: object,
                    type: objectType,
                    gridX: randomX,
                    gridY: randomY
                };

                placed++;
            } catch (error) {
                console.error(`Error placing ${objectType}:`, error);
                continue;
            }
        }
    }
    handleClick(pointer) {
        if (!this.selectedBuilding || pointer.rightButtonDown()) return;

        try {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const hoveredTile = this.grid.grid.flat().find(tile => {
                const bounds = new Phaser.Geom.Rectangle(
                    tile.x - tile.displayWidth / 2,
                    tile.y - tile.displayHeight / 2,
                    tile.displayWidth,
                    tile.displayHeight
                );
                return bounds.contains(worldPoint.x, worldPoint.y);
            });

            if (hoveredTile && hoveredTile.data) {
                const gridPosition = hoveredTile.data;
                const key = `${gridPosition.gridX},${gridPosition.gridY}`;

                // Verifica se a posição está ocupada
                if (this.grid.buildingGrid[key]) {
                    this.showFeedback('Posição já ocupada', false);
                    return;
                }

                // Verifica se a posição é válida
                if (!this.grid.isValidPosition(gridPosition.gridX, gridPosition.gridY)) {
                    this.showFeedback('Posição inválida', false);
                    return;
                }

                // Usa a posição exata do preview para posicionar a estrutura
                const {tileX, tileY} = this.grid.gridToIso(gridPosition.gridX, gridPosition.gridY);
                const worldX = this.cameras.main.centerX + tileX;
                const worldY = this.cameras.main.centerY + tileY;

                this.placeBuilding(gridPosition.gridX, gridPosition.gridY, worldX, worldY);
                console.log('Building placed at:', gridPosition.gridX, gridPosition.gridY);
            }
        } catch (error) {
            console.error('Error placing building:', error);
            this.showFeedback('Erro ao posicionar estrutura', false);
        }
    }

    showFeedback(message, success = true) {
        const text = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            message,
            { 
                fontSize: '16px',
                fill: success ? '#4CAF50' : '#f44336',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 20,
            duration: 5000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    placeBuilding(gridX, gridY, worldX, worldY) {
        try {
            // Validações iniciais
            if (!this.selectedBuilding) {
                console.log('No building selected');
                return;
            }

            if (!this.grid.isValidPosition(gridX, gridY)) {
                this.showFeedback('Posição inválida', false);
                return;
            }

            const key = `${gridX},${gridY}`;
            if (this.grid.buildingGrid[key]) {
                this.showFeedback('Posição já ocupada', false);
                return;
            }

            // Validar se é uma casa que pode ter NPC
            const npcHouses = ['farmerHouse', 'minerHouse', 'fishermanHouse'];
            const isNPCHouse = npcHouses.includes(this.selectedBuilding);

            // Criar a estrutura
            const building = this.add.sprite(worldX, worldY, this.selectedBuilding);
            if (!building) {
                throw new Error('Failed to create building sprite: sprite is null');
            }

            // Configurar a estrutura
            const scale = (this.grid.tileWidth * 1.4) / building.width;
            building.setScale(scale);
            building.setOrigin(0.5, 0.75);
            building.setDepth(gridY + 1);

            // Registrar no grid
            this.grid.buildingGrid[key] = {
                sprite: building,
                type: 'building',
                buildingType: this.selectedBuilding,
                gridX: gridX,
                gridY: gridY
            };

            // Create NPC for each house if it's a valid house type
            if (['farmerHouse', 'minerHouse', 'fishermanHouse'].includes(this.selectedBuilding)) {
                this.createFarmerNPC(gridX, gridY, worldX, worldY);
            }

            // Efeito de partículas
            const particles = this.add.particles(0, 0, 'tile_grass', {
                x: worldX,
                y: worldY,
                speed: 150,
                scale: { start: 0.3, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 400,
                blendMode: 'ADD',
                quantity: 6,
                emitting: false
            });

            particles.start();

            // Destruir o sistema de partículas após 500ms
            this.time.delayedCall(500, () => {
                particles.destroy();
            });

            // Feedback visual
            this.showFeedback('Estrutura construída!', true);

            // Limpar seleção e highlights
            this.clearBuildingSelection();
            this.clearTileHighlights();

            // Notificar outros sistemas
            this.events.emit('buildingPlaced', {
                gridX,
                gridY,
                buildingType: this.selectedBuilding
            });

            // Show panel after structure placement
            document.getElementById('side-panel').style.display = 'flex';

        } catch (error) {
            console.error('Error placing building:', error);
            this.showFeedback('Erro ao construir estrutura', false);
        }
    }

    clearBuildingSelection() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(b => b.classList.remove('selected'));
        this.selectedBuilding = null;
        if (this.previewBuilding) {
            this.previewBuilding.destroy();
            this.previewBuilding = null;
        }
    }

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
    createFarmerNPC(houseX, houseY, worldX, worldY) {
        // Import BaseNPC if not already imported
        import('./components/BaseNPC.js').then(({ default: BaseNPC }) => {
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
                movementDelay: 2000
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

        // Exemplo de inventário (pode ser expandido para um sistema real)
        const inventory = [
            '🌾', '🥕', '⛏️', null,
            '🪓', '🎣', null, null,
            '💎', null, null, null
        ];

        const modal = document.createElement('div');
        modal.className = 'npc-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-button">✕</button>
                <div class="npc-header">
                    <div class="npc-avatar">
                        ${npc.config.emoji}
                    </div>
                    <div class="npc-info">
                        <h3>${npc.config.name}</h3>
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

                <div class="npc-tabs">
                    <button class="tab-button active" data-tab="inventory">🎒 Inventário</button>
                    <button class="tab-button" data-tab="jobs">💼 Trabalhos</button>
                    <button class="tab-button" data-tab="skills">🌟 Skills</button>
                </div>

                <div class="tab-content" id="inventory-tab">
                    <div class="inventory-grid">
                        ${Array(12).fill(null).map((_, i) => `
                            <div class="inventory-slot ${inventory[i] ? '' : 'empty'}">
                                ${inventory[i] || ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tab-content" id="jobs-tab" style="display: none;">
                    <div class="jobs-list">
                        <div class="job-item">
                            <span class="job-icon">🌾</span>
                            <span class="job-name">Agricultura</span>
                            <div class="job-progress"><div style="width: 60%"></div></div>
                        </div>
                        <div class="job-item">
                            <span class="job-icon">⛏️</span>
                            <span class="job-name">Mineração</span>
                            <div class="job-progress"><div style="width: 30%"></div></div>
                        </div>
                        <div class="job-item">
                            <span class="job-icon">🎣</span>
                            <span class="job-name">Pesca</span>
                            <div class="job-progress"><div style="width: 45%"></div></div>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="skills-tab" style="display: none;">
                    <div class="skills-tree">
                        <div class="skill-branch">
                            <div class="skill-node active">🌱 Cultivo Básico</div>
                            <div class="skill-node">🌿 Cultivo Avançado</div>
                            <div class="skill-node locked">🌳 Mestre Agricultor</div>
                        </div>
                        <div class="skill-branch">
                            <div class="skill-node active">⛏️ Mineração Básica</div>
                            <div class="skill-node locked">💎 Mineração Avançada</div>
                            <div class="skill-node locked">⚒️ Mestre Minerador</div>
                        </div>
                    </div>
                </div>

                <div class="npc-inventory">
                    ${npc.config.tools.map(tool => `
                        <div class="tool-slot">
                            <div class="tool-emoji">${tool.emoji}</div>
                            <div class="tool-name">${tool.name}</div>
                            <div class="tool-description">${tool.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#autonomous').onclick = () => {
            // Transição suave da câmera
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 1.5,
                duration: 500,
                ease: 'Power2',
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

    createTopBar() {
        // Criar container da top bar fixo na câmera
        const topBar = this.add.rectangle(0, 0, window.innerWidth, 50, 0x2d2d2d);
        topBar.setOrigin(0, 0);
        topBar.setScrollFactor(0);
        topBar.setDepth(1000);

        // Adicionar texto exemplo
        const villageText = this.add.text(10, 15, 'My Village', {
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
        .setDepth(1000)
        .setInteractive();

        shopButton.on('pointerdown', () => {
            this.shopSystem.openShop();
        });
    }

cleanupEvents() {
        if (!this.eventCleanupList) return;

        // Clear registered events
        this.eventCleanupList.forEach(cleanup => {
            if (typeof cleanup === 'function') {
                try {
                    cleanup();
                } catch (err) {
                    console.warn('Error cleaning up event:', err);
                }
            }
        });
        this.eventCleanupList.clear();

        // Remove global listeners
        this.events.off('shutdown', this.cleanupEvents, this);
        this.input.keyboard.removeAllKeys(true);
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();

        // Stop all animations and tweens
        this.anims.removeAll();
        this.tweens.killAll();

        // Clear any running timers
        this.time.removeAllEvents();
    }
}
