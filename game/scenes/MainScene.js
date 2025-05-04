
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
        
        // Criar câmera UI separada
        this.uiCamera = this.cameras.add(0, 0, 800, 600);
        this.uiCamera.setScroll(0, 0);
        this.uiCamera.setBackgroundColor('rgba(0,0,0,0)');
        
        // Container para elementos do jogo
        this.gameContainer = this.add.container(0, 0);
        
        // Container para UI
        this.uiContainer = this.add.container(0, 0);
        
        // Configurar câmeras
        this.mainCamera.ignore(this.uiContainer);
        this.uiCamera.ignore(this.gameContainer);
        
        this.createIsometricGrid(10, 10);
        this.createBuildingPanel();
        
        this.setupInputEvents();
        this.setupFarmerAnimation();
    }

    createBuildingPanel() {
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
        
        // Criar container do painel
        this.buildingPanel = this.add.container(10, 10);
        this.uiContainer.add(this.buildingPanel);
        
        // Background do painel
        const panel = this.add.graphics();
        panel.fillStyle(0x2c3e50, 0.9);
        panel.fillRect(0, 0, panelWidth, panelHeight);
        this.buildingPanel.add(panel);

        // Botão de toggle
        const toggleButton = this.add.graphics();
        toggleButton.fillStyle(0x34495e, 1);
        toggleButton.fillRect(panelWidth + 10, 0, 30, 30);
        toggleButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 30), Phaser.Geom.Rectangle.Contains);
        
        const toggleIcon = this.add.text(panelWidth + 20, 5, '<', { 
            fontSize: '20px',
            fill: '#fff' 
        });
        
        this.buildingPanel.add(toggleButton);
        this.buildingPanel.add(toggleIcon);

        toggleButton.on('pointerdown', () => {
            this.buildingPanel.visible = !this.buildingPanel.visible;
            toggleIcon.setText(this.buildingPanel.visible ? '<' : '>');
        });

        // Título
        const title = this.add.text(10, 10, 'Estruturas', { 
            fontSize: '20px', 
            fill: '#fff',
            fontFamily: 'Arial'
        });
        this.buildingPanel.add(title);

        // Lista de buildings
        buildings.forEach((building, index) => {
            const y = 50 + (index * 55);
            
            // Background do botão
            const button = this.add.graphics();
            button.fillStyle(0x34495e, 0.8);
            button.fillRect(10, y, panelWidth - 20, 45);
            button.setInteractive(new Phaser.Geom.Rectangle(10, y, panelWidth - 20, 45), Phaser.Geom.Rectangle.Contains);
            
            // Nome da estrutura
            const text = this.add.text(20, y + 12, building.name, { 
                fontSize: '16px', 
                fill: '#fff',
                fontFamily: 'Arial'
            });
            
            // Thumbnail
            const thumbnail = this.add.image(panelWidth - 35, y + 22, building.key);
            const scale = 40 / thumbnail.height;
            thumbnail.setScale(scale);
            
            this.buildingPanel.add(button);
            this.buildingPanel.add(text);
            this.buildingPanel.add(thumbnail);

            // Interatividade
            button.on('pointerdown', () => {
                this.selectedBuilding = building.key;
            });

            button.on('pointerover', () => {
                button.clear();
                button.fillStyle(0x3498db, 0.8);
                button.fillRect(10, y, panelWidth - 20, 45);
            });

            button.on('pointerout', () => {
                button.clear();
                button.fillStyle(0x34495e, 0.8);
                button.fillRect(10, y, panelWidth - 20, 45);
            });
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

    setupInputEvents() {
        this.input.on('pointerdown', (pointer) => {
            if (this.isMobile) {
                if (!this.isPointerOverUI(pointer)) {
                    this.touchStartTime = Date.now();
                    this.isDragging = true;
                    this.dragStartX = pointer.x;
                    this.dragStartY = pointer.y;
                }
            } else if (pointer.rightButtonDown()) {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            } else if (!this.isPointerOverUI(pointer)) {
                this.handleClick(pointer);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging && !this.isPointerOverUI(pointer)) {
                const deltaX = pointer.x - this.dragStartX;
                const deltaY = pointer.y - this.dragStartY;
                
                this.mainCamera.scrollX -= deltaX;
                this.mainCamera.scrollY -= deltaY;
                
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Zoom com roda do mouse
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (!this.isPointerOverUI(pointer)) {
                const zoom = this.mainCamera.zoom;
                const newZoom = zoom - (deltaY * 0.001);
                this.mainCamera.setZoom(
                    Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                );
            }
        });

        // Zoom com pinça no mobile
        if (this.isMobile) {
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
    }

    isPointerOverUI(pointer) {
        return this.buildingPanel.getBounds().contains(pointer.x, pointer.y);
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

    placeBuilding(x, y, buildingKey) {
        const tileX = (x - y) * this.tileWidth;
        const tileY = (x + y) * this.tileHeight / 2;

        const building = this.add.image(
            this.cameras.main.centerX + tileX,
            this.cameras.main.centerY + tileY - (this.tileHeight / 2),
            buildingKey
        );
        
        building.setDepth(y + 1);
        const scale = (this.tileWidth * 1.5) / building.width;
        building.setScale(scale);
        
        this.gameContainer.add(building);
        return building;
    }

    handleClick(pointer) {
        if (!this.selectedBuilding) return;

        const worldX = pointer.x + this.mainCamera.scrollX - this.cameras.main.centerX;
        const worldY = pointer.y + this.mainCamera.scrollY - this.cameras.main.centerY;

        const gridX = Math.round((worldX / this.tileWidth + worldY / this.tileHeight) / 2);
        const gridY = Math.round((worldY / this.tileHeight - worldX / this.tileWidth) / 2);

        if (gridX >= 0 && gridX < this.grid[0].length && 
            gridY >= 0 && gridY < this.grid.length) {
            this.placeBuilding(gridX, gridY, this.selectedBuilding);
        }
    }
}

export default MainScene;
