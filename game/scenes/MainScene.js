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
        
        // Centraliza a câmera na origem
        this.cameras.main.centerOn(0, 0);

        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.updatePreview, this);

        this.createFarmerCharacter();
        this.placeEnvironmentObjects();
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
                    this.cameras.main.centerX + tileX + (-(this.grid.width * this.grid.tileWidth) / 2),
                    this.cameras.main.centerY + tileY + (-(this.grid.height * this.grid.tileHeight) / 4) - (this.grid.tileHeight / 4),
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

        // Load farmer sprite frames
        for (let i = 1; i <= 12; i++) {
            this.load.image(`farmer${i}`, `attached_assets/Farmer_${i}-ezgif.com-resize.png`);
        }
    }

    setupUIHandlers() {
        const centerMapBtn = document.getElementById('centerMap');
        centerMapBtn.addEventListener('click', () => {
            this.cameras.main.centerOn(0, 0);
        });

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

    createFarmerCharacter() {
        this.anims.create({
            key: 'walk_down',
            frames: [
                { key: 'farmer1' },
                { key: 'farmer2' },
                { key: 'farmer3' },
                { key: 'farmer4' },
                { key: 'farmer5' },
                { key: 'farmer6' },
                { key: 'farmer7' },
                { key: 'farmer8' },
                { key: 'farmer9' },
                { key: 'farmer10' },
                { key: 'farmer11' },
                { key: 'farmer12' }
            ],
            frameRate: 8,
            repeat: -1
        });

        const startGridPos = { x: 5, y: 5 };
        const { tileX, tileY } = this.grid.gridToIso(startGridPos.x, startGridPos.y);
        const centerOffsetX = -(this.grid.width * this.grid.tileWidth) / 2;
        const centerOffsetY = -(this.grid.height * this.grid.tileHeight) / 4;

        this.farmer = this.add.sprite(
            this.cameras.main.centerX + tileX + centerOffsetX,
            this.cameras.main.centerY + tileY + centerOffsetY - 20,
            'farmer'
        );

        this.farmer.setScale(2);
        this.farmer.setDepth(startGridPos.y + 1);
        this.farmer.play('walk_down');

        this.moveFarmerToNextTile();
    }

    moveFarmerToNextTile() {
        const randomDir = Math.floor(Math.random() * 4);
        const directions = [
            { x: 1, y: 0 }, // direita
            { x: -1, y: 0 }, // esquerda
            { x: 0, y: 1 }, // baixo
            { x: 0, y: -1 } // cima
        ];

        const currentPos = {
            x: Math.round((this.farmer.x - this.cameras.main.centerX + (this.grid.width * this.grid.tileWidth) / 2) / this.grid.tileWidth),
            y: Math.round((this.farmer.y - this.cameras.main.centerY + (this.grid.height * this.grid.tileHeight) / 4) / (this.grid.tileHeight / 2))
        };

        const newPos = {
            x: currentPos.x + directions[randomDir].x,
            y: currentPos.y + directions[randomDir].y
        };

        if (this.grid.isValidPosition(newPos.x, newPos.y)) {
            const { tileX, tileY } = this.grid.gridToIso(newPos.x, newPos.y);
            const centerOffsetX = -(this.grid.width * this.grid.tileWidth) / 2;
            const centerOffsetY = -(this.grid.height * this.grid.tileHeight) / 4;

            this.tweens.add({
                targets: this.farmer,
                x: this.cameras.main.centerX + tileX + centerOffsetX,
                y: this.cameras.main.centerY + tileY + centerOffsetY - 20,
                duration: 1000,
                onComplete: () => {
                    this.farmer.setDepth(newPos.y + 1);
                    this.moveFarmerToNextTile();
                }
            });
        } else {
            this.moveFarmerToNextTile();
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

                const centerOffsetX = -(this.grid.width * this.grid.tileWidth) / 2;
                const centerOffsetY = -(this.grid.height * this.grid.tileHeight) / 4;
                
                const object = this.add.image(
                    this.cameras.main.centerX + tileX + centerOffsetX,
                    this.cameras.main.centerY + tileY + centerOffsetY - (this.grid.tileHeight / 4),
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

    placeBuilding(gridX, gridY) {
        if (!this.selectedBuilding || !this.isValidGridPosition(gridX, gridY)) return;

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