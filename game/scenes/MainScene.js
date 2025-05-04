import BuildingPanel from '../ui/BuildingPanel.js';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.tileWidth = 32;
        this.tileHeight = 32;
        this.minZoom = 0.3;
        this.maxZoom = 3;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.selectedBuilding = null;
    }

    preload() {
        this.load.image('tile_grass', 'assets/tiles/tile_grass.png');
        this.load.image('tile_grass_2', 'assets/tiles/tile_grass_2.png');
        this.load.image('tile_grass_2_flowers', 'assets/tiles/tile_grass_2_flowers.png');
        this.load.image('tile_grass_3_flower', 'assets/tiles/tile_grass_3_flower.png');

        this.load.image('chickenHouse', 'assets/buildings/ChickenHouse.png');
        this.load.image('cowHouse', 'assets/buildings/CowHouse.png');
        this.load.image('farmerHouse', 'assets/buildings/FarmerHouse.png');
        this.load.image('minerHouse', 'assets/buildings/MinerHouse.png');
        this.load.image('pigHouse', 'assets/buildings/PigHouse.png');
        this.load.image('fishermanHouse', 'assets/buildings/fishermanHouse.png');

        this.load.spritesheet('farmer', 'assets/sprites/Farmer.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        this.mainCamera = this.cameras.main;
        this.gameContainer = this.add.container(0, 0);

        this.createIsometricGrid(10, 10);
        this.setupFarmerAnimation();
        this.setupInputEvents();

        // Criar UI separada
        this.buildingPanel = new BuildingPanel(this, 0, 0);
        this.buildingPanel.setScrollFactor(0);
        this.mainCamera.ignore(this.buildingPanel);

        // Escutar evento de seleção de building
        this.events.on('buildingSelected', (buildingKey) => {
            this.selectedBuilding = buildingKey;
        });
    }

    createIsometricGrid(width, height) {
        this.grid = [];
        for (let y = 0; y < height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < width; x++) {
                const tileX = (x - y) * this.tileWidth;
                const tileY = (x + y) * (this.tileHeight / 2);

                const tile = this.add.image(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY,
                    'tile_grass'
                );

                tile.displayWidth = this.tileWidth * 2;
                tile.displayHeight = this.tileHeight * 2;
                tile.setOrigin(0.5, 0.75);
                tile.setInteractive();
                tile.data = { gridX: x, gridY: y };

                this.gameContainer.add(tile);
                this.grid[y][x] = tile;
            }
        }
    }

    setupFarmerAnimation() {
        this.anims.create({
            key: 'walk_down',
            frames: this.anims.generateFrameNumbers('farmer', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.farmer = this.add.sprite(400, 300, 'farmer');
        this.farmer.setScale(2);
        this.farmer.setDepth(1);
        this.farmer.play('walk_down');
        this.gameContainer.add(this.farmer);
    }

    setupInputEvents() {
        this.input.on('pointerdown', (pointer) => {
            if (this.isMobile) {
                if (!this.buildingPanel.contains(pointer.x, pointer.y)) {
                    this.handleMobileInput(pointer);
                }
            } else if (pointer.rightButtonDown()) {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            } else if (!this.buildingPanel.contains(pointer.x, pointer.y)) {
                this.handleClick(pointer);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging && !this.buildingPanel.contains(pointer.x, pointer.y)) {
                this.handleDrag(pointer);
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        this.setupZoomControls();
    }

    setupZoomControls() {
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (!this.buildingPanel.contains(pointer.x, pointer.y)) {
                const zoom = this.mainCamera.zoom;
                const newZoom = zoom - (deltaY * 0.001);
                this.mainCamera.setZoom(
                    Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                );
            }
        });

        if (this.isMobile) {
            this.setupMobilePinchZoom();
        }
    }

    setupMobilePinchZoom() {
        this.input.addPointer(1);
        let prevDist = 0;

        this.input.on('pointermove', (pointer) => {
            if (this.input.pointer1?.isDown && this.input.pointer2?.isDown) {
                const dx = this.input.pointer1.x - this.input.pointer2.x;
                const dy = this.input.pointer1.y - this.input.pointer2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (prevDist > 0) {
                    const delta = dist - prevDist;
                    const zoom = this.mainCamera.zoom;
                    const newZoom = zoom + (delta * 0.002);
                    this.mainCamera.setZoom(
                        Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                    );
                }
                prevDist = dist;
            }
        });

        this.input.on('pointerup', () => {
            prevDist = 0;
        });
    }

    handleMobileInput(pointer) {
        this.touchStartTime = Date.now();
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
    }

    handleDrag(pointer) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;

        this.mainCamera.scrollX -= deltaX;
        this.mainCamera.scrollY -= deltaY;

        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
    }

    handleClick(pointer) {
        if (!this.selectedBuilding) return;

        const worldPoint = this.mainCamera.getWorldPoint(pointer.x, pointer.y);

        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const tile = this.grid[y][x];
                if (Phaser.Geom.Rectangle.Contains(tile.getBounds(), worldPoint.x, worldPoint.y)) {
                    this.placeBuilding(x, y, this.selectedBuilding);
                    return;
                }
            }
        }
    }

    placeBuilding(x, y, buildingKey) {
        const tile = this.grid[y][x];
        const building = this.add.image(
            tile.x,
            tile.y - (this.tileHeight / 2),
            buildingKey
        );

        building.setDepth(y + 1);
        const scale = (this.tileWidth * 2) / building.width;
        building.setScale(scale);

        this.gameContainer.add(building);
        return building;
    }
}

export default MainScene;