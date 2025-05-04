
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.tileWidth = 32;
        this.tileHeight = 32;
        this.minZoom = 0.3;
        this.maxZoom = 3;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    preload() {
        // Carrega os tiles
        this.load.image('tile_grass', 'assets/tiles/tile_grass.png');
        this.load.image('tile_grass_2', 'assets/tiles/tile_grass_2.png');
        this.load.image('tile_grass_2_flowers', 'assets/tiles/tile_grass_2_flowers.png');
        this.load.image('tile_grass_3_flower', 'assets/tiles/tile_grass_3_flower.png');
        
        // Carrega as buildings
        this.load.image('chickenHouse', 'assets/buildings/ChickenHouse.png');
        this.load.image('cowHouse', 'assets/buildings/CowHouse.png');
        this.load.image('farmerHouse', 'assets/buildings/FarmerHouse.png');
        this.load.image('minerHouse', 'assets/buildings/MinerHouse.png');
        this.load.image('pigHouse', 'assets/buildings/PigHouse.png');
        this.load.image('fishermanHouse', 'assets/buildings/fishermanHouse.png');

        // Carrega o farmer
        this.load.spritesheet('farmer', 'assets/sprites/Farmer.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        // Configuração das câmeras
        this.mainCamera = this.cameras.main;
        this.uiCamera = this.cameras.add(0, 0, 800, 600);
        this.uiCamera.setScroll(0, 0);
        this.uiCamera.ignore([]);

        // Container para UI
        this.uiContainer = this.add.container(0, 0);
        this.isPanelVisible = true;
        
        this.createIsometricGrid(5, 5);
        this.createBuildingPanel();
        
        // Configuração de interação
        this.isDragging = false;
        this.touchStartTime = 0;
        
        this.setupInputEvents();
        this.setupInitialBuildings();
        this.setupFarmerAnimation();
    }

    setupInputEvents() {
        this.input.on('pointerdown', (pointer) => {
            if (this.isMobile) {
                this.touchStartTime = Date.now();
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            } else if (pointer.rightButtonDown()) {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            } else {
                this.handleClick(pointer);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging && !(this.input.pointer1?.isDown && this.input.pointer2?.isDown)) {
                const deltaX = pointer.x - this.dragStartX;
                const deltaY = pointer.y - this.dragStartY;
                
                this.cameras.main.scrollX -= deltaX;
                this.cameras.main.scrollY -= deltaY;
                
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (this.isMobile) {
                const touchDuration = Date.now() - this.touchStartTime;
                const dragDistance = Phaser.Math.Distance.Between(
                    this.dragStartX, 
                    this.dragStartY, 
                    pointer.x, 
                    pointer.y
                );
                
                if (touchDuration < 200 && dragDistance < 10) {
                    this.handleClick(pointer);
                }
            }
            this.isDragging = false;
        });

        if (!this.isMobile) {
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                const zoom = this.cameras.main.zoom;
                const newZoom = zoom - (deltaY * (window.innerWidth < 768 ? 0.0005 : 0.001));
                this.cameras.main.setZoom(
                    Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                );
            });
        }

        // Suporte para pinça no mobile
        this.input.addPointer(1);
        let prevDist = 0;
        let lastZoomTime = 0;
        
        this.input.on('pointermove', (pointer) => {
            const now = Date.now();
            
            if (this.input.pointer1?.isDown && this.input.pointer2?.isDown) {
                const dx = this.input.pointer1.x - this.input.pointer2.x;
                const dy = this.input.pointer1.y - this.input.pointer2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (prevDist > 0 && (now - lastZoomTime > 16)) {
                    const delta = dist - prevDist;
                    const zoom = this.cameras.main.zoom;
                    const sensitivity = window.innerWidth < 768 ? 0.002 : 0.001;
                    const newZoom = zoom + (delta * sensitivity);
                    this.cameras.main.setZoom(
                        Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                    );
                    lastZoomTime = now;
                }
                prevDist = dist;
            }
        });

        this.input.on('pointerup', () => {
            prevDist = 0;
        });
    }

    setupInitialBuildings() {
        this.placeBuilding(0, 0, 'farmerHouse');
        this.placeBuilding(4, 0, 'cowHouse');
        this.placeBuilding(0, 4, 'chickenHouse');
        this.placeBuilding(4, 4, 'pigHouse');
        this.placeBuilding(2, 2, 'minerHouse');
    }

    setupFarmerAnimation() {
        this.anims.create({
            key: 'walk_down',
            frames: this.anims.generateFrameNumbers('farmer', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.farmer = this.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            'farmer'
        );
        
        this.farmer.setScale(2);
        this.farmer.setDepth(1);
        this.farmer.play('walk_down');

        this.tweens.add({
            targets: this.farmer,
            x: this.farmer.x + 100,
            y: this.farmer.y + 50,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }

    createIsometricGrid(width, height) {
        this.grid = [];
        const gridWidth = 10;
        const gridHeight = 10;
        
        for (let y = 0; y < gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                const tileX = (x - y) * this.tileWidth;
                const tileY = (x + y) * (this.tileHeight / 2);

                const tile = this.add.image(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY,
                    'tile_grass'
                );
                
                tile.displayWidth = this.tileWidth;
                tile.displayHeight = this.tileHeight;
                tile.setOrigin(0.5, 0.75);
                
                tile.setInteractive();
                tile.data = { gridX: x, gridY: y };
                tile.on('rightdown', (event) => {
                    event.event.preventDefault();
                });
                this.grid[y][x] = tile;
            }
        }
    }

    createBuildingPanel() {
        this.buildingPanel = this.add.container(0, 0);
        this.uiContainer.add(this.buildingPanel);

        // Botão de expandir/ocultar
        const toggleButton = this.add.graphics();
        toggleButton.fillStyle(0x2c3e50, 1);
        toggleButton.fillRect(10, 10, 30, 30);
        toggleButton.setInteractive(new Phaser.Geom.Rectangle(10, 10, 30, 30), Phaser.Geom.Rectangle.Contains);
        this.uiContainer.add(toggleButton);

        // Ícone do botão
        const toggleIcon = this.add.text(20, 15, '>', { 
            fontSize: '20px',
            fill: '#fff'
        });
        this.uiContainer.add(toggleIcon);

        toggleButton.on('pointerdown', () => {
            this.isPanelVisible = !this.isPanelVisible;
            this.buildingPanel.setVisible(this.isPanelVisible);
            toggleIcon.setText(this.isPanelVisible ? '<' : '>');
        });

        const buildings = [
            { key: 'farmerHouse', name: 'Casa do Fazendeiro' },
            { key: 'cowHouse', name: 'Estábulo' },
            { key: 'chickenHouse', name: 'Galinheiro' },
            { key: 'pigHouse', name: 'Chiqueiro' },
            { key: 'minerHouse', name: 'Casa do Minerador' },
            { key: 'fishermanHouse', name: 'Casa do Pescador' }
        ];

        const panelWidth = 200;
        const panelHeight = 400;
        
        const panel = this.add.graphics();
        panel.fillStyle(0x2c3e50, 0.8);
        panel.fillRect(10, 10, panelWidth, panelHeight);
        this.uiContainer.add(panel);

        const title = this.add.text(20, 20, 'Estruturas', { 
            fontSize: '20px', 
            fill: '#fff' 
        });
        this.uiContainer.add(title);

        buildings.forEach((building, index) => {
            const y = 60 + (index * 55);
            
            const button = this.add.graphics();
            button.fillStyle(0x34495e, 0.8);
            button.fillRect(20, y, panelWidth - 20, 45);
            button.setInteractive(new Phaser.Geom.Rectangle(20, y, panelWidth - 20, 45), Phaser.Geom.Rectangle.Contains);
            this.buildingPanel.add(button);

            const text = this.add.text(30, y + 12, building.name, { 
                fontSize: '16px', 
                fill: '#fff' 
            });
            this.buildingPanel.add(text);

            const thumbnail = this.add.image(panelWidth - 40, y + 22, building.key);
            const scaleRatio = 40 / thumbnail.height;
            thumbnail.setScale(scaleRatio);
            this.buildingPanel.add(thumbnail);

            button.on('pointerdown', () => {
                this.selectedBuilding = building.key;
            });

            button.on('pointerover', () => {
                button.clear();
                button.fillStyle(0x3498db, 0.8);
                button.fillRect(20, y, panelWidth - 20, 45);
            });

            button.on('pointerout', () => {
                button.clear();
                button.fillStyle(0x34495e, 0.8);
                button.fillRect(20, y, panelWidth - 20, 45);
            });
        });

        this.uiCamera.ignore(this.children.list);
        this.uiCamera.ignore([this.grid]);
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
        const scale = (this.tileWidth * 0.8) / building.width;
        building.setScale(scale);
        
        return building;
    }

    handleClick(pointer) {
        const worldX = pointer.x - this.cameras.main.centerX;
        const worldY = pointer.y - this.cameras.main.centerY;

        const gridX = Math.round((worldX / this.tileWidth + worldY / this.tileHeight));
        const gridY = Math.round((worldY / this.tileHeight - worldX / this.tileWidth));

        if (gridX >= 0 && gridX < this.grid[0].length && 
            gridY >= 0 && gridY < this.grid.length) {
            if (this.selectedBuilding) {
                this.placeBuilding(gridX, gridY, this.selectedBuilding);
            }
        }
    }
}

export default MainScene;
