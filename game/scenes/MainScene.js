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
        const simulateKey = (key) => {
            this.handleKeyDown({ key: key.toLowerCase() });
        };

        document.querySelector('.mobile-up').addEventListener('touchstart', () => simulateKey('W'));
        document.querySelector('.mobile-down').addEventListener('touchstart', () => simulateKey('S'));
        document.querySelector('.mobile-left').addEventListener('touchstart', () => simulateKey('A'));
        document.querySelector('.mobile-right').addEventListener('touchstart', () => simulateKey('D'));
    }


        });

        this.load.start();
    }

    handleKeyDown(event) {
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
            duration: 500,
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
            return;
        }

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
                const tileScale = 1.2;
                const scale = (this.grid.tileWidth * tileScale) / this.previewBuilding.width;
                this.previewBuilding.setScale(scale);
                this.previewBuilding.setOrigin(0.5, 1);
                this.previewBuilding.setAlpha(0.6);
            } else {
                this.previewBuilding.setPosition(worldX, worldY);
            }
            this.previewBuilding.setDepth(gridPosition.gridY + 1);
        }
    }

    loadAssets() {
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
                const scale = (this.grid.tileWidth * (objectType === 'tree' ? 1.2 : 0.8)) / Math.max(object.width, 1);
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
                // Use uma área de colisão mais precisa para o tile isométrico
                const tileCenter = new Phaser.Geom.Point(tile.x, tile.y);
                const distance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, tile.x, tile.y);

                // Define uma área de colisão mais precisa baseada na forma do tile
                const isoWidth = tile.displayWidth * 0.5;
                const isoHeight = tile.displayHeight * 0.5;

                // Calcula a distância relativa ao centro do tile
                const dx = Math.abs(worldPoint.x - tile.x) / isoWidth;
                const dy = Math.abs(worldPoint.y - tile.y) / isoHeight;

                // Verifica se o ponto está dentro da área do tile isométrico
                return (dx + dy) <= 1;
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

                this.placeBuilding(gridPosition.gridX, gridPosition.gridY);
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

    placeBuilding(gridX, gridY) {
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

            // Calcula posição no mundo
            const {tileX, tileY} = this.grid.gridToIso(gridX, gridY);
            const worldX = this.cameras.main.centerX + tileX;
            const worldY = this.cameras.main.centerY + tileY;

            // Criar a estrutura
            const building = this.add.sprite(worldX, worldY - (this.grid.tileHeight / 4), this.selectedBuilding);
            if (!building) {
                throw new Error('Failed to create building sprite: sprite is null');
            }
            if (!building) {
                throw new Error('Failed to create building sprite');
            }

            // Configurar a estrutura
            const tileScale = 1.2;
            const scale = (this.grid.tileWidth * tileScale) / Math.max(building.width, 1);
            building.setScale(scale);
            building.setOrigin(0.5, 1);
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

            // Limpar seleção
            this.clearBuildingSelection();

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

    create() {
        if (!this.textures.exists('tile_grass')) {
            return;
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

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const initialZoom = isMobile ? 0.8 : 1.5;
        this.cameras.main.setZoom(initialZoom);

        // Add auto-save interval (every 2 minutes)
        setInterval(() => this.autoSave(), 120000);
    }


}