
import Grid from './components/Grid.js';
import InputManager from './components/InputManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Carrega as texturas dos tiles
        this.load.image('tile_grass', 'game/assets/tiles/tile_grass.png');
        this.load.image('tile_grass_2', 'game/assets/tiles/tile_grass_2.png');
        this.load.image('tile_grass_2_flowers', 'game/assets/tiles/tile_grass_2_flowers.png');
        this.load.image('tile_grass_3_flowers', 'game/assets/tiles/tile_grass_3_flowers.png');
    }

    create() {
        console.log('GameScene iniciada');
        
        // Configurar a top bar
        this.createTopBar();
        
        // Cria o grid 20x20
        const gridOffsetY = 50; // Offset para compensar a top bar
        this.cameras.main.setViewport(0, gridOffsetY, window.innerWidth, window.innerHeight - gridOffsetY);
        
        this.grid = new Grid(this, 20, 20);
        this.grid.create();

        // Configura o input manager para controle da câmera
        this.inputManager = new InputManager(this);
        this.inputManager.init();
    }

    createTopBar() {
        // Criar container da top bar fixo na câmera
        const topBar = this.add.rectangle(0, 0, window.innerWidth, 50, 0x2d2d2d);
        topBar.setOrigin(0, 0);
        topBar.setScrollFactor(0);
        topBar.setDepth(1000);

        // Adicionar texto exemplo
        const villageText = this.add.text(10, 15, 'My Village', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        villageText.setScrollFactor(0);
        villageText.setDepth(1000);

        // Atualizar posição quando a tela for redimensionada
        this.scale.on('resize', (gameSize) => {
            topBar.width = gameSize.width;
        });
    }

    update() {
        // Atualiza o grid conforme necessário
        if (this.grid) {
            this.grid.updateVisibleTiles();
        }
    }
}
