
export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.tileWidth = 64;
        this.tileHeight = 64;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        this.selectedBuilding = null;
        this.buildingGrid = {};
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    preload() {
        const tiles = [
            'tile_grass',
            'tile_grass_2',
            'tile_grass_2_flowers',
            'tile_grass_3_flower'
        ];

        tiles.forEach(tile => {
            this.load.image(tile, `assets/tiles/${tile}.png`);
        });

        const buildings = [
            'chickenHouse|ChickenHouse',
            'cowHouse|CowHouse', 
            'farmerHouse|FarmerHouse',
            'minerHouse|MinerHouse',
            'pigHouse|PigHouse',
            'fishermanHouse|fishermanHouse'
        ];

        buildings.forEach(building => {
            const [key, filename] = building.split('|');
            this.load.image(key, `assets/buildings/${filename}.png`);
        });

        this.load.spritesheet('farmer', 'assets/sprites/Farmer.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        this.createIsometricGrid(10, 10);
        this.setupUIHandlers();
        this.setupInputHandlers();
        this.createInitialBuildings();
        this.createFarmerCharacter();
    }

    createIsometricGrid(width, height) {
        this.grid = [];
        for (let y = 0; y < height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < width; x++) {
                const tileX = (x - y) * (this.tileWidth - 0.5);
                const tileY = (x + y) * (this.tileHeight / 2 - 0.5);

                const tileTypes = [
                    'tile_grass',
                    'tile_grass',
                    'tile_grass_2',
                    'tile_grass_2',
                    'tile_grass_2_flowers',
                    'tile_grass_3_flower'
                ];

                const randomTile = tileTypes[Math.floor(Math.random() * tileTypes.length)];
                const tile = this.add.image(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY,
                    randomTile
                );

                tile.displayWidth = this.tileWidth + 1;
                tile.displayHeight = this.tileHeight + 1;
                tile.setOrigin(0.5, 0.75);
                tile.setInteractive();
                tile.data = { gridX: x, gridY: y };

                this.grid[y][x] = tile;
            }
        }
    }

    setupUIHandlers() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedBuilding = btn.dataset.building;
            });
        });
    }

    setupInputHandlers() {
        this.isDragging = false;
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerup', this.handlePointerUp, this);

        if (!this.isMobile) {
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                const zoom = this.cameras.main.zoom;
                const newZoom = zoom - (deltaY * (window.innerWidth < 768 ? 0.0005 : 0.001));
                this.cameras.main.setZoom(
                    Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom)
                );
            });
        }

        this.setupPinchZoom();
    }

    setupPinchZoom() {
        this.input.addPointer(1);
        let prevDist = 0;
        let lastZoomTime = 0;

        this.input.on('pointermove', (pointer) => {
            const now = Date.now();
            if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
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

    handlePointerDown(pointer) {
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
    }

    handlePointerMove(pointer) {
        const twoFingersDown = this.input.pointer1.isDown && this.input.pointer2.isDown;
        if (this.isDragging && !twoFingersDown) {
            const deltaX = pointer.x - this.dragStartX;
            const deltaY = pointer.y - this.dragStartY;
            this.cameras.main.scrollX -= deltaX;
            this.cameras.main.scrollY -= deltaY;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
        }
    }

    handlePointerUp(pointer) {
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
    }

    handleClick(pointer) {
        // Verifica se há uma estrutura selecionada
        if (!this.selectedBuilding) return;

        // Encontra o tile mais próximo do clique
        let closestTile = null;
        let closestDistance = Infinity;

        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const tile = this.grid[y][x];
                const distance = Phaser.Math.Distance.Between(
                    pointer.x,
                    pointer.y,
                    tile.x,
                    tile.y
                );
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTile = tile;
                }
            }
        }

        // Tenta posicionar a estrutura no tile mais próximo
        if (closestTile && !this.buildingGrid[`${closestTile.data.gridX},${closestTile.data.gridY}`]) {
            const success = this.placeBuilding(closestTile.data.gridX, closestTile.data.gridY, this.selectedBuilding);
            
            if (success) {
                // Limpa a seleção após posicionar com sucesso
                this.selectedBuilding = null;
                document.querySelectorAll('.building-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
            }
        }
    }

    placeBuilding(gridX, gridY, buildingKey) {
        const key = `${gridX},${gridY}`;

        if (this.buildingGrid[key] || !this.isValidGridPosition(gridX, gridY)) {
            return false;
        }

        try {
            const {x: tileX, y: tileY} = this.gridToIso(gridX, gridY);
            const building = this.add.image(
                this.cameras.main.centerX + tileX,
                this.cameras.main.centerY + tileY - (this.tileHeight / 3),
                buildingKey
            );

            building.setDepth(gridY + 1);
            const scale = (this.tileWidth * 1.2) / building.width;
            building.setScale(scale);

            this.buildingGrid[key] = {
                sprite: building,
                type: buildingKey,
                gridX,
                gridY
            };

            return true;
        } catch (error) {
            console.error('Error placing building:', error);
            return false;
        }
    }

    createInitialBuildings() {
        const initialBuildings = [
            [0, 0, 'farmerHouse'],
            [4, 0, 'cowHouse'],
            [0, 4, 'chickenHouse'],
            [4, 4, 'pigHouse'],
            [2, 2, 'minerHouse']
        ];

        initialBuildings.forEach(([x, y, type]) => {
            this.placeBuilding(x, y, type);
        });
    }

    createFarmerCharacter() {
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

        this.farmer.setScale(3);
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

    isValidGridPosition(x, y) {
        return x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length;
    }

    gridToIso(gridX, gridY) {
        return {
            x: (gridX - gridY) * this.tileWidth,
            y: (gridX + gridY) * this.tileHeight / 2
        };
    }
}
