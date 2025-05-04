export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        // Define tamanho fixo dos tiles em 32x32
        this.tileWidth = 64;
        this.tileHeight = 64;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        
        // Detecta se é dispositivo móvel
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Estrutura selecionada atualmente
        this.selectedBuilding = null;
        
        // Lista de construções disponíveis
        this.availableBuildings = [
            { key: 'farmerHouse', name: 'Casa do Fazendeiro' },
            { key: 'cowHouse', name: 'Estábulo' },
            { key: 'chickenHouse', name: 'Galinheiro' },
            { key: 'pigHouse', name: 'Chiqueiro' },
            { key: 'minerHouse', name: 'Casa do Minerador' },
            { key: 'fishermanHouse', name: 'Casa do Pescador' }
        ];
    }

    preload() {
        this.load.image('tile_grass', 'assets/tiles/tile_grass.png');
        this.load.image('tile_grass_2', 'assets/tiles/tile_grass_2.png');
        this.load.image('tile_grass_2_flowers', 'assets/tiles/tile_grass_2_flowers.png');
        this.load.image('tile_grass_3_flower', 'assets/tiles/tile_grass_3_flower.png');
        
        // Carrega as imagens das casas
        this.load.image('chickenHouse', 'assets/buildings/ChickenHouse.png');
        this.load.image('cowHouse', 'assets/buildings/CowHouse.png');
        this.load.image('farmerHouse', 'assets/buildings/FarmerHouse.png');
        this.load.image('minerHouse', 'assets/buildings/MinerHouse.png');
        this.load.image('pigHouse', 'assets/buildings/PigHouse.png');
        this.load.image('fishermanHouse', 'assets/buildings/fishermanHouse.png');

        // Carrega o spritesheet do Farmer
        this.load.spritesheet('farmer', 'assets/sprites/Farmer.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        this.createIsometricGrid(5, 5);
        this.createBuildingMenu();
        
        // Configuração do drag da câmera
        this.isDragging = false;
        this.touchStartTime = 0;
        
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
            // Verifica se há dois dedos na tela
            const twoFingersDown = this.input.pointer1.isDown && this.input.pointer2.isDown;
            
            // Só move o grid se estiver arrastando com um dedo
            if (this.isDragging && !twoFingersDown) {
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
                
                // Se o toque foi curto e não houve muito movimento, considera como clique
                if (touchDuration < 200 && dragDistance < 10) {
                    this.handleClick(pointer);
                }
            }
            this.isDragging = false;
        });
        
        // Configuração de zoom adaptativa
        if (!this.isMobile) {
            // Zoom com roda do mouse para PC
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                const zoom = this.cameras.main.zoom;
                const newZoom = zoom - (deltaY * (window.innerWidth < 768 ? 0.0005 : 0.001));
                this.cameras.main.setZoom(
                    Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                );
            });
        }

        // Suporte aprimorado para pinça no mobile
        this.input.addPointer(1);
        let prevDist = 0;
        let lastZoomTime = 0;
        
        this.input.on('pointermove', (pointer) => {
            const now = Date.now();
            
            if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
                const dx = this.input.pointer1.x - this.input.pointer2.x;
                const dy = this.input.pointer1.y - this.input.pointer2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (prevDist > 0 && (now - lastZoomTime > 16)) { // Limite de 60fps para zoom
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

        // Cria as animações do Farmer
        this.anims.create({
            key: 'walk_down',
            frames: this.anims.generateFrameNumbers('farmer', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Adiciona o Farmer
        this.farmer = this.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            'farmer'
        );
        
        // Ajusta a escala e profundidade
        this.farmer.setScale(3);
        this.farmer.setDepth(1);

        // Inicia a animação
        this.farmer.play('walk_down');

        // Adiciona movimento isométrico
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
        const gridWidth = 10;  // Increased grid size
        const gridHeight = 10; // Increased grid size
        
        for (let y = 0; y < gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                const tileX = (x - y) * (this.tileWidth - 0.5); // Remove horizontal spacing
                const tileY = (x + y) * (this.tileHeight / 2 - 0.5); // Remove vertical spacing

                // Lista de tiles disponíveis com pesos (mais tiles sem flores)
                const tileTypes = [
                    'tile_grass',
                    'tile_grass',
                    'tile_grass',
                    'tile_grass',
                    'tile_grass_2',
                    'tile_grass_2',
                    'tile_grass_2',
                    'tile_grass_2',
                    'tile_grass_2_flowers',  // menor chance
                    'tile_grass_3_flower'    // menor chance
                ];
                
                // Seleciona um tile aleatório (tiles sem flores têm maior chance)
                const randomTile = tileTypes[Math.floor(Math.random() * tileTypes.length)];
                
                // Cria o tile com a imagem aleatória
                const tile = this.add.image(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY,
                    randomTile
                );
                
                // Ajusta a escala para garantir que a imagem cubra todo o espaço
                tile.displayWidth = this.tileWidth + 1; // Adiciona 1 pixel para eliminar gaps
                tile.displayHeight = this.tileHeight + 1; // Adiciona 1 pixel para eliminar gaps
                tile.setOrigin(0.5, 0.75); // Mantém o alinhamento isométrico
                
                tile.setInteractive();
                tile.data = { gridX: x, gridY: y };
                tile.on('rightdown', (event) => {
                    event.event.preventDefault();
                });
                this.grid[y][x] = tile;
            }
        }
    }

    placeBuilding(x, y, buildingKey) {
        const tileX = (x - y) * this.tileWidth;
        const tileY = (x + y) * this.tileHeight / 2;

        const building = this.add.image(
            this.cameras.main.centerX + tileX,
            this.cameras.main.centerY + tileY - (this.tileHeight / 4), // Ajuste na altura para centralizar
            buildingKey
        );
        
        building.setDepth(y + 1);
        
        // Ajusta a escala para corresponder ao tamanho do tile com proporção melhor
        const scale = (this.tileWidth * 1.2) / building.width; // Aumenta para 120% do tamanho do tile
        building.setScale(scale);
        
        return building;
    }

    handleClick(pointer) {
        if (!this.selectedBuilding) return;
        
        const worldX = pointer.x - this.cameras.main.centerX;
        const worldY = pointer.y - this.cameras.main.centerY;

        const gridX = Math.round((worldX / this.tileWidth + worldY / this.tileHeight));
        const gridY = Math.round((worldY / this.tileHeight - worldX / this.tileWidth));

        if (gridX >= 0 && gridX < this.grid[0].length && 
            gridY >= 0 && gridY < this.grid.length) {
            this.placeBuilding(gridX, gridY, this.selectedBuilding);
        }
    }
}
    createBuildingMenu() {
        const menuY = 10;
        const buttonWidth = 140;
        const buttonHeight = 40;
        const buttonSpacing = 10;
        
        this.availableBuildings.forEach((building, index) => {
            const button = this.add.rectangle(
                10 + buttonWidth/2,
                menuY + (buttonHeight + buttonSpacing) * index,
                buttonWidth,
                buttonHeight,
                0x4a4a4a
            );
            
            const text = this.add.text(
                button.x,
                button.y,
                building.name,
                {
                    font: '16px Arial',
                    fill: '#ffffff'
                }
            ).setOrigin(0.5);
            
            button.setScrollFactor(0);
            text.setScrollFactor(0);
            button.setInteractive();
            
            button.on('pointerover', () => {
                button.setFillStyle(0x666666);
            });
            
            button.on('pointerout', () => {
                button.setFillStyle(0x4a4a4a);
            });
            
            button.on('pointerdown', () => {
                this.selectedBuilding = building.key;
                this.availableBuildings.forEach((b, i) => {
                    const otherButton = this.children.list.find(
                        child => child.type === 'Rectangle' &&
                        child.y === menuY + (buttonHeight + buttonSpacing) * i
                    );
                    if (otherButton) {
                        otherButton.setFillStyle(0x4a4a4a);
                    }
                });
                button.setFillStyle(0x00ff00);
            });
        });
    }
