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
        // Load tile images
        const tiles = [
            'tile_grass',
            'tile_grass_2',
            'tile_grass_2_flowers',
            'tile_grass_3_flower'
        ];

        tiles.forEach(tile => {
            this.load.image(tile, `assets/tiles/${tile}.png`);
        });

        // Load tree images
        const trees = [
            { key: 'tree_simple', path: 'attached_assets/tree_simple.png' },
            { key: 'tree_pine', path: 'attached_assets/tree_pine.png' },
            { key: 'tree_fruit', path: 'attached_assets/tree_fruit.png' },
            { key: 'tree_autumn', path: 'attached_assets/tree_autumn.png' }
        ];

        trees.forEach(tree => {
            this.load.image(tree.key, tree.path);
        });

        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading asset:', fileObj.key);
        });

        this.load.on('filecomplete', (key, type, data) => {
            if (trees.includes(key)) {
                console.log('Successfully loaded tree:', key);
            }
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
        this.createFarmerCharacter();
        this.placeTrees();
    }

    placeTrees() {
        const treeTypes = ['tree_simple', 'tree_pine', 'tree_fruit', 'tree_autumn'];
        const numTrees = 15;
        let placedTrees = 0;

        while (placedTrees < numTrees) {
            const randomX = Math.floor(Math.random() * this.grid[0].length);
            const randomY = Math.floor(Math.random() * this.grid.length);
            const key = `${randomX},${randomY}`;

            if (this.buildingGrid[key]) {
                continue;
            }

            try {
                const randomTree = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                const {x: tileX, y: tileY} = this.gridToIso(randomX, randomY);

            const tree = this.add.image(
                this.cameras.main.centerX + tileX,
                this.cameras.main.centerY + tileY - (this.tileHeight / 4),
                randomTree
            );

            tree.setDepth(randomY + 1);
            const scale = (this.tileWidth * 1.2) / Math.max(tree.width, 1);
            tree.setScale(scale);
            tree.setOrigin(0.5, 0.8);

            this.buildingGrid[key] = {
                sprite: tree,
                type: 'tree',
                gridX: randomX,
                gridY: randomY
            };

            placedTrees++;
            } catch (error) {
                console.error('Error placing tree:', error);
                continue;
            }
        }
    }

    createIsometricGrid(width, height) {
        this.grid = [];
        for (let y = 0; y < height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < width; x++) {
                const tileX = (x - y) * (this.tileWidth - 0.5);
                const tileY = (x + y) * (this.tileHeight / 2 - 0.5);

                const hasAdjacentFlowers = (x, y) => {
                    const neighbors = [
                        [x-1, y], [x+1, y],
                        [x, y-1], [x, y+1]
                    ];
                    return neighbors.some(([nx, ny]) => 
                        this.grid[ny]?.[nx]?.texture.key.includes('flower')
                    );
                };

                const tileTypes = [
                    'tile_grass',
                    'tile_grass',
                    'tile_grass',
                    'tile_grass_2',
                    'tile_grass_2',
                    'tile_grass_2'
                ];

                let randomTile;
                if (!hasAdjacentFlowers(x, y) && Math.random() < 0.15) {
                    randomTile = Math.random() < 0.5 ? 'tile_grass_2_flowers' : 'tile_grass_3_flower';
                } else {
                    randomTile = tileTypes[Math.floor(Math.random() * tileTypes.length)];
                }
                
                const tile = this.add.image(
                    this.cameras.main.centerX + tileX,
                    this.cameras.main.centerY + tileY,
                    randomTile
                );

                tile.displayWidth = this.tileWidth;
                tile.displayHeight = this.tileHeight;
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
        if (!this.selectedBuilding) return;

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        let minDistance = Infinity;
        let clickedTile = null;

        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const tile = this.grid[y][x];
                const tileCenter = {
                    x: tile.x,
                    y: tile.y - (this.tileHeight / 4) 
                };

                const distance = Phaser.Math.Distance.Between(
                    worldPoint.x,
                    worldPoint.y,
                    tileCenter.x,
                    tileCenter.y
                );

                if (distance < minDistance && distance < this.tileWidth) {
                    minDistance = distance;
                    clickedTile = tile;
                }
            }
        }

        if (clickedTile && !this.buildingGrid[`${clickedTile.data.gridX},${clickedTile.data.gridY}`]) {
            const success = this.placeBuilding(clickedTile.data.gridX, clickedTile.data.gridY, this.selectedBuilding);

            if (success) {
                this.selectedBuilding = null;
                document.querySelectorAll('.building-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
            }
        }
    }

    placeBuilding(gridX, gridY, buildingKey) {
        const key = `${gridX},${gridY}`;

        if (!this.isValidGridPosition(gridX, gridY)) {
            return false;
        }

        if (this.buildingGrid[key]) {
            console.log('Tile ocupado');
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