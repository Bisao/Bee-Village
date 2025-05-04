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

        // Carrega o spritesheet do personagem
        this.load.spritesheet('character', 'assets/sprites/character.png', {
            frameWidth: 32,
            frameHeight: 32
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

        // Cria as animações
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('character', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Adiciona o personagem
        this.character = this.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'character'
        );

        // Inicia a animação
        this.character.play('walk');

        // Adiciona movimento
        this.tweens.add({
            targets: this.character,
            x: this.character.x + 100,
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