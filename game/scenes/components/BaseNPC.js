
export default class BaseNPC {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.gridX = x;
        this.gridY = y;
        this.isMoving = false;
        this.isAutonomous = true;
        
        // Configurações customizáveis
        this.config = {
            name: config.name || 'Unknown',
            profession: config.profession || 'Villager',
            emoji: config.emoji || '👤',
            spritesheet: config.spritesheet || 'farmer',
            scale: config.scale || 0.8,
            movementDelay: config.movementDelay || 2000,
            level: config.level || 1,
            xp: config.xp || 0,
            maxXp: config.maxXp || 100,
            tools: this.getToolsByProfession(config.profession),
            ...config
        };

        this.init();
    }

    init() {
        const {tileX, tileY} = this.scene.grid.gridToIso(this.gridX, this.gridY);
        const worldX = this.scene.cameras.main.centerX + tileX;
        const worldY = this.scene.cameras.main.centerY + tileY;
        
        // Criar sprite
        this.sprite = this.scene.add.sprite(worldX, worldY - 32, 'farmer1');
        this.sprite.setScale(this.config.scale);
        this.sprite.setDepth(this.gridY + 2);
        this.sprite.setInteractive();
        
        // Verificar se está na posição inicial (casa)
        this.checkIfInHouse();

        // Criar texto do nome
        this.nameText = this.scene.add.text(worldX, worldY - 64, 
            `${this.config.emoji} ${this.config.name}`, {
                fontSize: '14px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                resolution: 2
            }
        ).setOrigin(0.5);
        this.nameText.setDepth(this.gridY + 3);

        // Setup de eventos
        this.setupEvents();
    }

    setupEvents() {
        this.sprite.on('pointerdown', () => this.showControls());
        
        // Esconder sprite inicialmente
        this.sprite.setVisible(false);
        
        // Atrasar movimento para fora da casa em 10 segundos
        this.scene.time.delayedCall(10000, () => {
            const newY = this.gridY + 1;
            if (this.scene.grid.isValidPosition(this.gridX, newY) && 
                !this.scene.isTileOccupied(this.gridX, newY)) {
                this.moveTo(this.gridX, newY);
                // Sprite só fica visível quando estiver fora da casa
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: { from: 0, to: 1 },
                    duration: 500,
                    onStart: () => this.sprite.setVisible(true)
                });
            }
            
            if (this.isAutonomous) {
                this.startAutonomousMovement();
            }
        });
    }

    showControls() {
        this.scene.showNPCControls(this);
    }

    startAutonomousMovement() {
        if (this.config.profession === 'Farmer') {
            this.startFarmerBehavior();
        } else {
            this.scene.time.addEvent({
                delay: this.config.movementDelay,
                callback: () => this.moveRandomly(),
                loop: true
            });
        }
    }

    startFarmerBehavior() {
        // Timer para plantar a cada 2 minutos
        this.plantingTimer = this.scene.time.addEvent({
            delay: 120000, // 2 minutos
            callback: () => this.findAndPlant(),
            loop: true
        });

        // Timer para verificar colheitas prontas
        this.harvestTimer = this.scene.time.addEvent({
            delay: 5000, // Verificar a cada 5 segundos
            callback: () => this.checkAndHarvestCrops(),
            loop: true
        });

        // Movimento aleatório quando não está plantando/colhendo
        this.moveTimer = this.scene.time.addEvent({
            delay: this.config.movementDelay,
            callback: () => {
                if (!this.isPlanting && !this.isHarvesting) {
                    this.moveRandomly();
                }
            },
            loop: true
        });
    }

    async findAndPlant() {
        if (this.isPlanting || this.isHarvesting) return;
        this.isPlanting = true;

        // Encontrar tile livre em um raio de 3 tiles
        const farmableSpot = this.findFarmableSpot();
        if (farmableSpot) {
            // Mover até o local
            await this.moveToSpot(farmableSpot.x, farmableSpot.y);
            
            // Preparar terra e plantar
            this.scene.grid.makeTileFarmable(farmableSpot.x, farmableSpot.y);
            if (this.scene.grid.plantCrop(farmableSpot.x, farmableSpot.y, 'potato')) {
                // Mostrar emoji de semente
                this.showCropEmoji(farmableSpot.x, farmableSpot.y, '🌱');
                
                // Após 7 segundos, mostrar broto
                this.scene.time.delayedCall(7000, () => {
                    this.showCropEmoji(farmableSpot.x, farmableSpot.y, '🌿');
                });
                
                // Após 15 segundos total, mostrar batata
                this.scene.time.delayedCall(15000, () => {
                    this.showCropEmoji(farmableSpot.x, farmableSpot.y, '🥔');
                });
            }
        }
        
        this.isPlanting = false;
    }

    async checkAndHarvestCrops() {
        if (this.isPlanting || this.isHarvesting) return;
        this.isHarvesting = true;

        // Procurar por colheitas prontas
        const readyCrops = this.findReadyCrops();
        for (const crop of readyCrops) {
            await this.moveToSpot(crop.x, crop.y);
            const harvested = this.scene.grid.harvestCrop(crop.x, crop.y);
            if (harvested) {
                // Remover emoji da colheita
                this.removeCropEmoji(crop.x, crop.y);
                this.scene.showFeedback(`${this.config.name} colheu ${harvested}! 🥔`, true);
            }
        }

        this.isHarvesting = false;
    }

    findFarmableSpot() {
        const radius = 3;
        const spots = [];
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = this.gridX + dx;
                const y = this.gridY + dy;
                
                if (this.scene.grid.isValidPosition(x, y) && 
                    !this.scene.isTileOccupied(x, y) &&
                    !this.scene.grid.farmableTiles?.[`${x},${y}`]) {
                    spots.push({x, y});
                }
            }
        }
        
        return spots.length > 0 ? spots[Math.floor(Math.random() * spots.length)] : null;
    }

    findReadyCrops() {
        const readyCrops = [];
        if (!this.scene.grid.farmableTiles) return readyCrops;

        Object.entries(this.scene.grid.farmableTiles).forEach(([key, tile]) => {
            if (tile.state === 'ready') {
                const [x, y] = key.split(',').map(Number);
                readyCrops.push({x, y});
            }
        });

        return readyCrops;
    }

    async moveToSpot(x, y) {
        return new Promise(resolve => {
            const path = this.findPathTo(x, y);
            let currentStep = 0;

            const moveNextStep = () => {
                if (currentStep >= path.length) {
                    resolve();
                    return;
                }

                const next = path[currentStep];
                this.moveTo(next.x, next.y);
                currentStep++;

                this.scene.time.delayedCall(700, moveNextStep);
            };

            moveNextStep();
        });
    }

    findPathTo(targetX, targetY) {
        // Implementação simples de pathfinding
        const path = [];
        let currentX = this.gridX;
        let currentY = this.gridY;

        while (currentX !== targetX || currentY !== targetY) {
            if (currentX < targetX) currentX++;
            else if (currentX > targetX) currentX--;
            if (currentY < targetY) currentY++;
            else if (currentY > targetY) currentY--;

            path.push({x: currentX, y: currentY});
        }

        return path;
    }

    showCropEmoji(x, y, emoji) {
        const key = `crop_${x}_${y}`;
        const {tileX, tileY} = this.scene.grid.gridToIso(x, y);
        
        if (this.cropEmojis?.[key]) {
            this.cropEmojis[key].destroy();
        }

        if (!this.cropEmojis) this.cropEmojis = {};
        
        this.cropEmojis[key] = this.scene.add.text(
            this.scene.cameras.main.centerX + tileX,
            this.scene.cameras.main.centerY + tileY - 32,
            emoji,
            { fontSize: '20px' }
        ).setOrigin(0.5);
        this.cropEmojis[key].setDepth(y + 2);
    }

    removeCropEmoji(x, y) {
        const key = `crop_${x}_${y}`;
        if (this.cropEmojis?.[key]) {
            this.cropEmojis[key].destroy();
            delete this.cropEmojis[key];
        }
    }

    moveRandomly() {
        if (!this.isAutonomous || this.isMoving) return;

        const directions = this.scene.getAvailableDirections(this.gridX, this.gridY);
        if (directions.length === 0) {
            // Se não houver direções disponíveis, tentar novamente em 1 segundo
            this.scene.time.delayedCall(1000, () => this.moveRandomly());
            return;
        }

        // Priorizar movimentos que não retornam à posição anterior
        const filteredDirections = directions.filter(dir => {
            const newX = this.gridX + dir.x;
            const newY = this.gridY + dir.y;
            return !(this.lastPosition && 
                    this.lastPosition.x === newX && 
                    this.lastPosition.y === newY);
        });

        const directionToUse = filteredDirections.length > 0 ? 
            filteredDirections[Math.floor(Math.random() * filteredDirections.length)] :
            directions[Math.floor(Math.random() * directions.length)];

        // Guardar posição atual antes de mover
        this.lastPosition = { x: this.gridX, y: this.gridY };
        this.moveTo(this.gridX + directionToUse.x, this.gridY + directionToUse.y);
    }

    checkIfInHouse() {
        const key = `${this.gridX},${this.gridY}`;
        const currentTile = this.scene.grid.buildingGrid[key];
        const isInHouse = currentTile && currentTile.type === 'building';
        this.sprite.setVisible(!isInHouse);
    }

    moveTo(newX, newY) {
        if (this.isMoving) return;

        const {tileX, tileY} = this.scene.grid.gridToIso(newX, newY);
        this.isMoving = true;

        // Mostra o sprite ao sair da casa
        this.sprite.setVisible(true);

        // Define frames da animação baseado na direção
        let frameRange;
        if (newY < this.gridY) frameRange = [1, 4];  // up
        else if (newY > this.gridY) frameRange = [9, 12];  // down
        else if (newX < this.gridX) frameRange = [5, 8];  // left
        else frameRange = [1, 4];  // right/default

        // Atualiza frame estático quando não há animação
        const baseFrame = `${this.config.spritesheet}${frameRange[0]}`;
        this.sprite.setTexture(baseFrame);

        // Gera frames para animação
        const frames = [];
        for (let i = frameRange[0]; i <= frameRange[1]; i++) {
            frames.push({ key: `${this.config.spritesheet}${i}` });
        }

        // Cria e toca animação temporária
        const animKey = `temp_move_${Date.now()}`;
        this.scene.anims.create({
            key: animKey,
            frames: frames,
            frameRate: 8,
            repeat: -1
        });
        this.sprite.play(animKey);

        // Move o NPC
        this.scene.tweens.add({
            targets: [this.sprite, this.nameText],
            x: this.scene.cameras.main.centerX + tileX,
            y: (target, key, value, targetIndex) => {
                const baseY = this.scene.cameras.main.centerY + tileY;
                return targetIndex === 0 ? baseY - 32 : baseY - 64;
            },
            duration: 600,
            ease: 'Linear',
            onComplete: () => {
                this.gridX = newX;
                this.gridY = newY;
                this.sprite.setDepth(newY + 2);
                this.nameText.setDepth(newY + 3);
                this.isMoving = false;
                this.sprite.stop();
                this.checkIfInHouse();
            }
        });
    }

    getToolsByProfession(profession) {
        const toolsets = {
            'Farmer': [
                { name: 'Enchada', emoji: '🦾', description: 'Para cultivar a terra' },
                { name: 'Regador', emoji: '💧', description: 'Para regar as plantas' },
                { name: 'Escopeta', emoji: '🔫', description: 'Para defesa da fazenda' }
            ],
            'Miner': [
                { name: 'Picareta', emoji: '⛏️', description: 'Para minerar' },
                { name: 'Pá', emoji: '🔨', description: 'Para cavar' },
                { name: 'Lanterna', emoji: '🔦', description: 'Para iluminar' }
            ],
            'Fisher': [
                { name: 'Vara', emoji: '🎣', description: 'Para pescar' },
                { name: 'Rede', emoji: '🕸️', description: 'Para pegar peixes' },
                { name: 'Arpão', emoji: '🔱', description: 'Para peixes grandes' }
            ]
        };
        return toolsets[profession] || [];
    }

    destroy() {
        this.sprite.destroy();
        this.nameText.destroy();
    }
}
