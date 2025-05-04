export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.tileWidth = 64;
        this.tileHeight = 32;
    }

    preload() {
        this.load.image('tile', 'assets/tile.png');
        
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
        this.input.on('pointerdown', this.handleClick, this);

        // Posiciona algumas casas iniciais
        this.placeBuilding(0, 0, 'farmerHouse');
        this.placeBuilding(4, 0, 'cowHouse');
        this.placeBuilding(0, 4, 'chickenHouse');
        this.placeBuilding(4, 4, 'pigHouse');
        this.placeBuilding(2, 2, 'minerHouse');

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
        this.farmer.setScale(2);
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
        for (let y = 0; y < height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < width; x++) {
                const tileX = (x - y) * this.tileWidth / 2;
                const tileY = (x + y) * this.tileHeight / 2;

                const tile = this.add.image(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY,
                    'tile'
                );

                tile.setInteractive();
                tile.data = { gridX: x, gridY: y };
                this.grid[y][x] = tile;
            }
        }
    }

    placeBuilding(x, y, buildingKey) {
        const tileX = (x - y) * this.tileWidth / 2;
        const tileY = (x + y) * this.tileHeight / 2;

        const building = this.add.image(
            this.cameras.main.centerX + tileX,
            this.cameras.main.centerY + tileY - 32, // Ajuste a altura para parecer que está sobre o tile
            buildingKey
        );
        
        building.setDepth(y + 1); // Garante que as construções mais ao fundo apareçam atrás
        building.setScale(1.5);
        return building;
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
}