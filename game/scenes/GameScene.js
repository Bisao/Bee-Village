
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
        
        // Cria o grid 20x20
        this.grid = new Grid(this, 20, 20);
        this.grid.create();

        // Configura o input manager para controle da câmera
        this.inputManager = new InputManager(this);
        this.inputManager.init();
    }

    update() {
        // Atualiza o grid conforme necessário
        if (this.grid) {
            this.grid.updateVisibleTiles();
        }
    }
}
