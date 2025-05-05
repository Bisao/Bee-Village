import Grid from './components/Grid.js';
import InputManager from './components/InputManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.selectedBuilding = null;
        this.previewBuilding = null;
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

        this.grid.create();
        this.inputManager.init();
        this.setupUIHandlers();

        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.updatePreview, this);

        this.placeEnvironmentObjects();
        this.createFarmer();

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


            // Posição inicial no centro do grid
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
            //this.farmer.play('farmer_walk');
            this.farmer.setDepth(startY + 1);

            // Faz a câmera seguir o fazendeiro
            this.cameras.main.startFollow(this.farmer, true, 0.5, 0.5);

            // Adiciona controles WASD
            this.keys = this.input.keyboard.addKeys({
                w: Phaser.Input.Keyboard.KeyCodes.W,
                a: Phaser.Input.Keyboard.KeyCodes.A,
                s: Phaser.Input.Keyboard.KeyCodes.S,
                d: Phaser.Input.Keyboard.KeyCodes.D
            });

            this.input.keyboard.on('keydown', this.handleKeyDown, this);

    // Mobile controls
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

    create() {
        if (!this.textures.exists('tile_grass')) {
            return; // Wait for assets to load
        }
        this.grid = new Grid(this, 10, 10);
        this.inputManager = new InputManager(this);
        this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.grid.create();
        this.inputManager.init();
        this.setupUIHandlers();

        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.updatePreview, this);

        this.placeEnvironmentObjects();
        this.createFarmer();
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

    getAvailableDirections() {
        const directions = [
            { x: 1, y: 0 },   // direita
            { x: -1, y: 0 },  // esquerda
            { x: 0, y: 1 },   // baixo
            { x: 0, y: -1 }   // cima
        ];

        return directions.filter(dir => {
            const newX = this.farmer.gridX + dir.x;
            const newY = this.farmer.gridY + dir.y;
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
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedBuilding = btn.dataset.building;
                if (this.previewBuilding) {
                    this.previewBuilding.destroy();
                    this.previewBuilding = null;
                }
            });
        });
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

            // Se for uma casa de fazendeiro, cria um NPC
            if (this.selectedBuilding === 'farmerHouse') {
                this.createNPCFarmer(gridX, gridY, worldX, worldY);
            }

            // Usa as coordenadas exatas passadas como parâmetro

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
        } catch (error) {
            console.error('Error placing building:', error);
            this.showFeedback('Erro ao construir estrutura', false);
        }
    }

    createNPCFarmer(homeX, homeY, worldX, worldY) {
        const npc = this.add.sprite(worldX, worldY - 16, 'farmer1');
        npc.setScale(0.8);
        npc.setDepth(homeY + 1);
        npc.gridX = homeX;
        npc.gridY = homeY;
        npc.homeX = homeX;
        npc.homeY = homeY;
        npc.isMoving = false;
        npc.isWandering = false;

        // Criar as mesmas animações do jogador para o NPC
        this.anims.create({
            key: 'npc_up',
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
            key: 'npc_down',
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
            key: 'npc_left',
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
            key: 'npc_right',
            frames: [
                { key: 'farmer1' },
                { key: 'farmer2' },
                { key: 'farmer3' },
                { key: 'farmer4' }
            ],
            frameRate: 8,
            repeat: -1
        });

        // Iniciar comportamento de vagar
        this.time.addEvent({
            delay: 5000,
            callback: () => this.startWandering(npc),
            callbackScope: this
        });
    }

    startWandering(npc) {
        if (!npc.isWandering) {
            npc.isWandering = true;
            this.wanderNPC(npc);
        }
    }

    wanderNPC(npc) {
        if (!npc.isWandering) return;

        const directions = [
            { x: 1, y: 0, anim: 'npc_right' },
            { x: -1, y: 0, anim: 'npc_left' },
            { x: 0, y: 1, anim: 'npc_down' },
            { x: 0, y: -1, anim: 'npc_up' }
        ];

        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        const newX = npc.gridX + randomDir.x;
        const newY = npc.gridY + randomDir.y;

        if (this.grid.isValidPosition(newX, newY) && !this.isTileOccupied(newX, newY)) {
            const {tileX, tileY} = this.grid.gridToIso(newX, newY);
            npc.isMoving = true;
            npc.play(randomDir.anim);

            this.tweens.add({
                targets: npc,
                x: this.cameras.main.centerX + tileX,
                y: this.cameras.main.centerY + tileY - 16,
                duration: 600,
                ease: 'Quad.easeInOut',
                onComplete: () => {
                    npc.gridX = newX;
                    npc.gridY = newY;
                    npc.setDepth(newY + 1);
                    npc.isMoving = false;
                    npc.stop();

                    // Verificar se deve voltar para casa
                    if (Math.random() < 0.2) {
                        this.returnHome(npc);
                    } else {
                        // Continuar vagando após um delay
                        this.time.addEvent({
                            delay: 1000,
                            callback: () => this.wanderNPC(npc),
                            callbackScope: this
                        });
                    }
                }
            });
        } else {
            // Se não puder mover, tenta novamente
            this.time.addEvent({
                delay: 500,
                callback: () => this.wanderNPC(npc),
                callbackScope: this
            });
        }
    }

    returnHome(npc) {
        npc.isWandering = false;
        const path = this.findPathToHome(npc);
        
        if (path.length > 0) {
            this.moveAlongPath(npc, path, () => {
                // Quando chegar em casa, aguarda um tempo e começa a vagar novamente
                this.time.addEvent({
                    delay: 5000,
                    callback: () => this.startWandering(npc),
                    callbackScope: this
                });
            });
        }
    }

    findPathToHome(npc) {
        // Implementação simples de caminho - movimento direto para casa
        const dx = npc.homeX - npc.gridX;
        const dy = npc.homeY - npc.gridY;
        const path = [];

        // Adiciona movimentos horizontais
        for (let i = 0; i < Math.abs(dx); i++) {
            path.push({
                x: dx > 0 ? 1 : -1,
                y: 0,
                anim: dx > 0 ? 'npc_right' : 'npc_left'
            });
        }

        // Adiciona movimentos verticais
        for (let i = 0; i < Math.abs(dy); i++) {
            path.push({
                x: 0,
                y: dy > 0 ? 1 : -1,
                anim: dy > 0 ? 'npc_down' : 'npc_up'
            });
        }

        return path;
    }

    moveAlongPath(npc, path, onComplete) {
        if (path.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        const move = path[0];
        const newX = npc.gridX + move.x;
        const newY = npc.gridY + move.y;

        if (this.grid.isValidPosition(newX, newY) && !this.isTileOccupied(newX, newY)) {
            const {tileX, tileY} = this.grid.gridToIso(newX, newY);
            npc.isMoving = true;
            npc.play(move.anim);

            this.tweens.add({
                targets: npc,
                x: this.cameras.main.centerX + tileX,
                y: this.cameras.main.centerY + tileY - 16,
                duration: 600,
                ease: 'Quad.easeInOut',
                onComplete: () => {
                    npc.gridX = newX;
                    npc.gridY = newY;
                    npc.setDepth(newY + 1);
                    npc.isMoving = false;
                    npc.stop();

                    // Move para o próximo passo do caminho
                    this.moveAlongPath(npc, path.slice(1), onComplete);
                }
            });
        } else {
            // Se não puder mover, pula para o próximo movimento
            this.moveAlongPath(npc, path.slice(1), onComplete);
        }
    }

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
}
