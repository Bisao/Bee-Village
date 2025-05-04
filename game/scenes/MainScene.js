export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.tileWidth = 64;
        this.tileHeight = 64;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    preload() {
        // Corrigindo caminhos dos assets
        this.load.image('tile_grass', './assets/tiles/tile_grass.png');
        this.load.image('tile_grass_2', './assets/tiles/tile_grass_2.png');
        this.load.image('tile_grass_2_flowers', './assets/tiles/tile_grass_2_flowers.png');
        this.load.image('tile_grass_3_flower', './assets/tiles/tile_grass_3_flower.png');

        this.load.image('chickenHouse', './assets/buildings/ChickenHouse.png');
        this.load.image('cowHouse', './assets/buildings/CowHouse.png');
        this.load.image('farmerHouse', './assets/buildings/FarmerHouse.png');
        this.load.image('minerHouse', './assets/buildings/MinerHouse.png');
        this.load.image('pigHouse', './assets/buildings/PigHouse.png');
        this.load.image('fishermanHouse', './assets/buildings/fishermanHouse.png');

        this.load.spritesheet('farmer', './assets/sprites/Farmer.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        this.scale.on('resize', this.handleResize, this);
        this.handleResize(this.scale);

        this.createIsometricGrid(10, 10);

        this.setupControls();
    }

    handleResize(gameSize) {
        if (!gameSize) return;

        const width = gameSize.width;
        const height = gameSize.height;

        this.cameras.main.setViewport(0, 0, width, height);

        if (this.grid) {
            this.createIsometricGrid(10, 10);
        }
    }

    setupControls() {
        this.isDragging = false;
        this.touchStartTime = 0;
        this.lastTapTime = 0;

        this.input.on('pointerdown', (pointer) => {
            const currentTime = Date.now();
            
            if (this.isMobile) {
                if (currentTime - this.lastTapTime < 300) {
                    // Double tap - place building
                    this.handleClick(pointer);
                } else {
                    // Single tap - start drag
                    this.isDragging = true;
                    this.dragStartX = pointer.x;
                    this.dragStartY = pointer.y;
                }
                this.lastTapTime = currentTime;
            } else if (pointer.rightButtonDown()) {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            } else {
                this.handleClick(pointer);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging && pointer.isDown) {
                const deltaX = pointer.x - this.dragStartX;
                const deltaY = pointer.y - this.dragStartY;

                this.cameras.main.scrollX -= deltaX;
                this.cameras.main.scrollY -= deltaY;

                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        if (!this.isMobile) {
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                const zoom = this.cameras.main.zoom;
                const newZoom = zoom - (deltaY * 0.001);
                this.cameras.main.setZoom(
                    Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                );
            });
        }
    }

    createIsometricGrid(width, height) {
        if (this.grid) {
            this.grid.forEach(row => {
                row.forEach(tile => {
                    tile.destroy();
                });
            });
        }

        this.grid = [];
        const gridWidth = 10;
        const gridHeight = 10;
        
        // Ajusta o tamanho dos tiles para telas menores
        if (this.isMobile) {
            this.tileWidth = 48;
            this.tileHeight = 48;
        }
        
        // Centraliza o grid considerando o tamanho total
        const totalWidth = (gridWidth + gridHeight) * (this.tileWidth / 2);
        const totalHeight = (gridWidth + gridHeight) * (this.tileHeight / 4);
        
        const offsetX = this.cameras.main.width / 2;
        const offsetY = this.cameras.main.height / 3;

        for (let y = 0; y < height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < width; x++) {
                const tileX = (x - y) * (this.tileWidth / 2);
                const tileY = (x + y) * (this.tileHeight / 4);

                const tileTypes = [
                    'tile_grass',
                    'tile_grass',
                    'tile_grass',
                    'tile_grass_2',
                    'tile_grass_2',
                    'tile_grass_2',
                    'tile_grass_2_flowers',
                    'tile_grass_3_flower'
                ];

                const randomTile = tileTypes[Math.floor(Math.random() * tileTypes.length)];

                const tile = this.add.image(
                    offsetX + tileX,
                    offsetY + tileY,
                    randomTile
                );

                tile.displayWidth = this.tileWidth;
                tile.displayHeight = this.tileHeight;
                tile.setOrigin(0.5, 0.75);
                tile.setDepth(y); // Garante ordem correta de renderização

                tile.setInteractive();
                tile.data = { gridX: x, gridY: y };

                this.grid[y][x] = tile;
            }
        }
    }

    handleClick(pointer) {
        const worldX = pointer.x - this.cameras.main.centerX;
        const worldY = pointer.y - this.cameras.main.centerY;

        const gridX = Math.round((worldX / this.tileWidth + worldY / this.tileHeight));
        const gridY = Math.round((worldY / this.tileHeight - worldX / this.tileWidth));

        if (gridX >= 0 && gridX < this.grid[0].length && 
            gridY >= 0 && gridY < this.grid.length) {
            this.placeBuilding(gridX, gridY, 'farmerHouse');
        }
    }

    placeBuilding(x, y, buildingKey) {
        const tileX = (x - y) * this.tileWidth;
        const tileY = (x + y) * this.tileHeight / 2;

        const building = this.add.image(
            this.cameras.main.centerX + tileX,
            this.cameras.main.centerY + tileY - (this.tileHeight / 4),
            buildingKey
        );

        building.setDepth(y + 1);
        const scale = (this.tileWidth * 1.2) / building.width;
        building.setScale(scale);

        return building;
    }
}