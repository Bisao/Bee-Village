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
    }

    create() {
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
            const bounds = tile.getBounds();
            return bounds.contains(worldPoint.x, worldPoint.y);
        });

        if (hoveredTile) {
            const gridPosition = hoveredTile.data;
            const {tileX, tileY} = this.grid.gridToIso(gridPosition.gridX, gridPosition.gridY);

            if (!this.previewBuilding) {
                this.previewBuilding = this.add.image(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY - (this.grid.tileHeight / 4),
                    this.selectedBuilding
                );
                const scale = this.grid.tileWidth / Math.max(this.previewBuilding.width, 1);
                this.previewBuilding.setScale(scale * 1.2);
                this.previewBuilding.setOrigin(0.5, 0.8);
                this.previewBuilding.setAlpha(0.6);
            } else {
                this.previewBuilding.setPosition(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY - (this.grid.tileHeight / 4)
                );
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

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const hoveredTile = this.grid.grid.flat().find(tile => {
            const bounds = tile.getBounds();
            return bounds.contains(worldPoint.x, worldPoint.y);
        });

        if (hoveredTile) {
            const gridPosition = hoveredTile.data;
            this.placeBuilding(gridPosition.gridX, gridPosition.gridY);
        }
    }

    showFeedback(message, success = true) {
        const text = this.add.text(
            this.input.x, 
            this.input.y - 50,
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
            duration: 1000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    placeBuilding(gridX, gridY) {
        if (!this.selectedBuilding || !this.isValidGridPosition(gridX, gridY)) {
            this.showFeedback('Invalid position', false);
            return;
        }

        const key = `${gridX},${gridY}`;
        if (this.grid.buildingGrid[key]) return;

        const {tileX, tileY} = this.grid.gridToIso(gridX, gridY);
        const building = this.add.image(
            this.cameras.main.centerX + tileX,
            this.cameras.main.centerY + tileY - (this.grid.tileHeight / 4),
            this.selectedBuilding
        );

        building.setDepth(gridY + 1);
        const scale = this.grid.tileWidth / Math.max(building.width, 1);
        building.setScale(scale * 1.2);
        building.setOrigin(0.5, 0.8);

        this.grid.buildingGrid[key] = {
            sprite: building,
            type: 'building',
            gridX: gridX,
            gridY: gridY
        };

        // Reset selection after placing
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
}