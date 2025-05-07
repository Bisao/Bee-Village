
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
        
        // Configura viewport responsivo
        const topBarHeight = 50;
        const viewportWidth = this.scale.width;
        const viewportHeight = this.scale.height - topBarHeight;
        
        this.cameras.main.setViewport(0, topBarHeight, viewportWidth, viewportHeight);
        
        // Cria o grid com tamanho adaptativo
        const gridSize = Math.min(20, Math.floor(viewportWidth / 64)); // 64 é o tamanho base do tile
        this.grid = new Grid(this, gridSize, gridSize);
        this.grid.create();

        // Centraliza a câmera no grid
        const gridCenter = {
            x: (this.grid.width * this.grid.tileWidth) / 2,
            y: (this.grid.height * this.grid.tileHeight) / 2
        };
        this.cameras.main.centerOn(gridCenter.x, gridCenter.y);

        // Configura zoom inicial baseado no tamanho da tela
        const initialZoom = Math.min(
            viewportWidth / (this.grid.width * this.grid.tileWidth),
            viewportHeight / (this.grid.height * this.grid.tileHeight)
        ) * 0.9; // 90% do zoom máximo para dar margem
        this.cameras.main.setZoom(initialZoom);

        // Configura o input manager para controle da câmera
        this.inputManager = new InputManager(this);
        this.inputManager.init();

        // Cria o painel de estruturas
        this.createStructuresPanel();

        // Adiciona listener para redimensionamento
        this.scale.on('resize', (gameSize) => {
            this.handleResize(gameSize);
        });
    }

    handleResize(gameSize) {
        const topBarHeight = 50;
        const viewportWidth = gameSize.width;
        const viewportHeight = gameSize.height - topBarHeight;

        // Atualiza viewport
        this.cameras.main.setViewport(0, topBarHeight, viewportWidth, viewportHeight);

        // Recentraliza a câmera
        const gridCenter = {
            x: (this.grid.width * this.grid.tileWidth) / 2,
            y: (this.grid.height * this.grid.tileHeight) / 2
        };
        this.cameras.main.centerOn(gridCenter.x, gridCenter.y);

        // Atualiza zoom
        const newZoom = Math.min(
            viewportWidth / (this.grid.width * this.grid.tileWidth),
            viewportHeight / (this.grid.height * this.grid.tileHeight)
        ) * 0.9;
        this.cameras.main.setZoom(newZoom);

        // Recria o painel de estruturas para ajustar ao novo tamanho
        this.children.list
            .filter(child => child.depth === 1000)
            .forEach(child => child.destroy());
        this.createStructuresPanel();
    }

    preload() {
        // Carrega as texturas dos tiles
        this.load.image('tile_grass', 'game/assets/tiles/tile_grass.png');
        this.load.image('tile_grass_2', 'game/assets/tiles/tile_grass_2.png');
        this.load.image('tile_grass_2_flowers', 'game/assets/tiles/tile_grass_2_flowers.png');
        this.load.image('tile_grass_3_flowers', 'game/assets/tiles/tile_grass_3_flowers.png');
        
        // Carrega as texturas das estruturas
        this.load.image('ChickenHouse', 'game/assets/buildings/ChickenHouse.png');
        this.load.image('CowHouse', 'game/assets/buildings/CowHouse.png');
        this.load.image('FarmerHouse', 'game/assets/buildings/FarmerHouse.png');
        this.load.image('MinerHouse', 'game/assets/buildings/MinerHouse.png');
        this.load.image('PigHouse', 'game/assets/buildings/PigHouse.png');
        this.load.image('FishermanHouse', 'game/assets/buildings/fishermanHouse.png');
    }

    createStructuresPanel() {
        // Calcula dimensões responsivas
        const panelWidth = Math.min(300, this.scale.width * 0.8);
        const panelHeight = Math.min(400, this.scale.height * 0.7);
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        // Ajusta tamanho dos itens baseado no painel
        const itemsPerRow = this.scale.width < 768 ? 1 : 2;
        const padding = Math.max(5, Math.min(10, panelWidth * 0.03));
        const itemWidth = (panelWidth - (padding * 3)) / itemsPerRow;
        const itemHeight = Math.min(itemWidth, panelHeight * 0.25);
        
        // Container do painel
        const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x2d2d2d)
            .setScrollFactor(0)
            .setDepth(1000)
            .setAlpha(0.9);
        
        // Título do painel
        const title = this.add.text(centerX, centerY - panelHeight/2 + 30, 'Estruturas', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000);

        // Lista de estruturas com imagens
        const structures = [
            { key: 'ChickenHouse', name: 'Galinheiro' },
            { key: 'CowHouse', name: 'Estábulo' },
            { key: 'FarmerHouse', name: 'Casa do Fazendeiro' },
            { key: 'MinerHouse', name: 'Casa do Minerador' },
            { key: 'PigHouse', name: 'Chiqueiro' },
            { key: 'FishermanHouse', name: 'Casa do Pescador' }
        ];

        const itemsPerRow = 2;
        const itemWidth = 120;
        const itemHeight = 120;
        const padding = 10;
        const startY = centerY - panelHeight/2 + 80;

        structures.forEach((structure, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = centerX + (col - 0.5) * (itemWidth + padding);
            const y = startY + row * (itemHeight + padding);

            const button = this.add.rectangle(x, y, itemWidth, itemHeight, 0x4a4a4a)
                .setScrollFactor(0)
                .setDepth(1000)
                .setInteractive();

            const image = this.add.image(x, y, structure.key)
                .setScrollFactor(0)
                .setDepth(1000);
            
            // Ajusta a escala da imagem para caber no botão
            const scaleX = (itemWidth - 20) / image.width;
            const scaleY = (itemHeight - 20) / image.height;
            const scale = Math.min(scaleX, scaleY);
            image.setScale(scale);

            const text = this.add.text(x, y + 30, structure.name, {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: itemWidth - 10 }
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000);

            button.on('pointerover', () => button.setFillStyle(0x666666));
            button.on('pointerout', () => button.setFillStyle(0x4a4a4a));
            button.on('pointerdown', () => {
                // Aqui virá a lógica de construção
                console.log(`Selecionado: ${structure.name}`);
            });
        });

        // Botão de fechar
        const closeButton = this.add.text(centerX + panelWidth/2 - 30, centerY - panelHeight/2 + 20, '✖', {
            fontSize: '24px',
            color: '#ffffff'
        })
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(1000);

        closeButton.on('pointerdown', () => {
            panel.destroy();
            title.destroy();
            closeButton.destroy();
            // Destruir todos os elementos do painel
            this.children.list
                .filter(child => child.depth === 1000)
                .forEach(child => child.destroy());
        });
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
