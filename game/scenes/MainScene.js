export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.tileWidth = 64;
        this.tileHeight = 32;
    }

    preload() {
        // Placeholder tiles - replace with your assets
        this.load.image('tile', 'assets/tile.png');
        this.load.image('building', 'assets/building.png');

        // Carrega o spritesheet do Farmer
        this.load.spritesheet('farmer', 'assets/sprites/Farmer.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    createAnimations() {
        // Define a animação de caminhada
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('character', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
    }

    create() {
        this.createIsometricGrid(5, 5);
        this.input.on('pointerdown', this.handleClick, this);

        // Cria as animações do Farmer
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('farmer', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Adiciona o Farmer
        this.farmer = this.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'farmer'
        );
        
        // Ajusta a escala para melhor visualização
        this.farmer.setScale(2);

        // Inicia a animação
        this.farmer.play('walk');

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

    handleClick(pointer) {
        // Convert screen coordinates to isometric grid coordinates
        const worldX = pointer.x - this.cameras.main.centerX;
        const worldY = pointer.y - this.cameras.main.centerY;

        const gridX = Math.round((worldX / this.tileWidth + worldY / this.tileHeight));
        const gridY = Math.round((worldY / this.tileHeight - worldX / this.tileWidth));

        if (gridX >= 0 && gridX < this.grid[0].length && 
            gridY >= 0 && gridY < this.grid.length) {
            console.log(`Clicked grid position: ${gridX}, ${gridY}`);
            // Aqui você pode adicionar a lógica de construção
        }
    }
}