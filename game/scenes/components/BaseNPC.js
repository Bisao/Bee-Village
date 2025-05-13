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
        this.inventory = this.getInitialInventory();
        const {tileX, tileY} = this.scene.grid.gridToIso(this.gridX, this.gridY);
        const worldX = this.scene.cameras.main.centerX + tileX;
        const worldY = this.scene.cameras.main.centerY + tileY;

        this.sprite = this.scene.add.sprite(worldX, worldY - 32, 'farmer1');
        this.sprite.setScale(this.config.scale);
        this.sprite.setDepth(this.gridY + 2);
        this.sprite.setInteractive();

        this.checkIfInHouse();

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

        this.setupEvents();
        this.setupControls();
    }

    setupControls() {
        this.controls = this.scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    setupEvents() {
        this.sprite.on('pointerdown', () => this.showControls());
        this.sprite.setVisible(false);
        this.homePosition = { x: this.gridX, y: this.gridY };
    }

    startAutonomousMovement() {
        if (!this.isAutonomous) return;

        const firstStep = () => {
            const newY = this.gridY + 1;
            if (this.scene.grid.isValidPosition(this.gridX, newY) && 
                !this.scene.isTileOccupied(this.gridX, newY)) {
                this.moveTo(this.gridX, newY);
            }
        };

        firstStep();

        const moveNPC = () => {
            if (!this.isAutonomous || this.isMoving) return;

            const directions = this.scene.getAvailableDirections(this.gridX, this.gridY);
            if (directions.length === 0) return;

            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            this.moveTo(this.gridX + randomDir.x, this.gridY + randomDir.y);
        };

        this.movementTimer = this.scene.time.addEvent({
            delay: 2000,
            callback: moveNPC,
            loop: true
        });
    }

    enablePlayerControl() {
        this.updateHandler = () => {
            if (!this || this.isMoving || this.isAutonomous || this.scene.currentControlledNPC !== this) return;

            let newX = this.gridX;
            let newY = this.gridY;

            if (this.controls.w.isDown) newY--;
            else if (this.controls.s.isDown) newY++;
            else if (this.controls.a.isDown) newX--;
            else if (this.controls.d.isDown) newX++;

            if (newX !== this.gridX || newY !== this.gridY) {
                if (this.scene.grid.isValidPosition(newX, newY) && !this.scene.isTileOccupied(newX, newY)) {
                    this.moveTo(newX, newY);
                }
            }
        };

        this.scene.events.on('update', this.updateHandler);
    }

    showControls() {
        this.scene.showNPCControls(this);
    }

    moveTo(newX, newY) {
        if (this.isMoving) return;

        const {tileX, tileY} = this.scene.grid.gridToIso(newX, newY);
        this.isMoving = true;

        this.sprite.setVisible(true);

        let animationKey;
        if (newY < this.gridY) animationKey = 'up';
        else if (newY > this.gridY) animationKey = 'down';
        else if (newX < this.gridX) animationKey = 'left';
        else animationKey = 'right';

        const frameConfig = {
            'up': [1, 4],
            'down': [9, 12],
            'left': [5, 8],
            'right': [1, 4]
        };
        const frameRange = frameConfig[animationKey];

        const baseFrame = `${this.config.spritesheet}${frameRange[0]}`;
        this.sprite.setTexture(baseFrame);

        const frames = [];
        for (let i = frameRange[0]; i <= frameRange[1]; i++) {
            frames.push({ key: `${this.config.spritesheet}${i}` });
        }

        const animKey = `temp_move_${Date.now()}`;
        this.scene.anims.create({
            key: animKey,
            frames: frames,
            frameRate: 8,
            repeat: -1
        });
        this.sprite.play(animKey);

        this.scene.tweens.add({
            targets: [this.sprite, this.nameText],
            x: this.scene.cameras.main.centerX + tileX,
            y: (target, key, value, targetIndex) => {
                const baseY = this.scene.cameras.main.centerY + tileY;
                return targetIndex === 0 ? baseY - 32 : baseY - 64;
            },
            duration: Math.max(400, Math.sqrt(Math.pow(newX - this.gridX, 2) + Math.pow(newY - this.gridY, 2)) * 800),
            ease: 'Quad.easeInOut',
            onComplete: () => {
                this.gridX = newX;
                this.gridY = newY;
                this.sprite.setDepth(newY + 2);
                this.nameText.setDepth(newY + 3);
                this.isMoving = false;
                this.sprite.stop();
                this.checkIfInHouse();

                this.scene.tweens.add({
                    targets: [this.sprite, this.nameText],
                    y: '-=2',
                    duration: 100,
                    yoyo: true,
                    ease: 'Quad.easeOut'
                });
            }
        });
    }

    leaveHouse() {
        const positions = [
            { x: this.gridX, y: this.gridY + 1 },
            { x: this.gridX, y: this.gridY - 1 },
            { x: this.gridX + 1, y: this.gridY },
            { x: this.gridX - 1, y: this.gridY }
        ];

        for (const pos of positions) {
            if (this.scene.grid.isValidPosition(pos.x, pos.y) && 
                !this.scene.isTileOccupied(pos.x, pos.y)) {
                this.moveTo(pos.x, pos.y);
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: { from: 0, to: 1 },
                    duration: 500,
                    onStart: () => this.sprite.setVisible(true)
                });
                return true;
            }
        }
        return false;
    }

    returnHome() {
        if (this.homePosition) {
            this.moveTo(this.homePosition.x, this.homePosition.y);
            this.scene.time.delayedCall(1000, () => {
                this.sprite.setVisible(false);
            });
        }
    }

    checkIfInHouse() {
        const key = `${this.gridX},${this.gridY}`;
        const currentTile = this.scene.grid.buildingGrid[key];
        const isInHouse = currentTile && currentTile.type === 'building';
        this.sprite.setVisible(!isInHouse);
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
            ],
            'Lumberjack': [
                { name: 'Machado', emoji: '🪓', description: 'Para cortar árvores' },
                { name: 'Serra', emoji: '🪚', description: 'Para serrar madeira' },
                { name: 'Corda', emoji: '🪢', description: 'Para arrastar troncos' }
            ]
        };
        return toolsets[profession] || [];
    }

    getInitialInventory() {
        const baseInventory = {
            maxCapacity: 5
        };

        switch (this.config.profession) {
            case 'Lumberjack':
                return { ...baseInventory, wood: 0 };
            case 'Farmer':
                return { ...baseInventory, wheat: 0, seeds: 0 };
            case 'Miner':
                return { ...baseInventory, ore: 0 };
            case 'Fisher':
                return { ...baseInventory, fish: 0 };
            default:
                return baseInventory;
        }
    }

    hasInventorySpace(itemType) {
        // Verifica se o NPC pode armazenar este tipo de item
        if (!this.inventory.hasOwnProperty(itemType)) {
            console.log(`[${this.config.name}] Não pode armazenar ${itemType}`);
            return false;
        }
        return this.inventory[itemType] < this.inventory.maxCapacity;
    }

    interactWithNearbyResource() {
        if (this.isMoving || !this.isAutonomous) return;

        const range = 2; // Alcance de interação
        const resourceTypes = {
            'Farmer': 'crop',
            'Miner': 'ore',
            'Fisher': 'fish',
            'Lumberjack': 'tree'
        };

        const resourceType = resourceTypes[this.config.profession];
        if (!resourceType) return;

        // Procura recursos próximos
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                const checkX = this.gridX + dx;
                const checkY = this.gridY + dy;
                const key = `${checkX},${checkY}`;
                const tile = this.scene.grid.buildingGrid[key];

                if (tile && tile.type === resourceType && !tile.isProcessed) {
                    this.processResource(tile, key);
                    return;
                }
            }
        }
    }

    processResource(resource, key) {
        if (!this.hasInventorySpace(resource.type)) return;

        const processingTime = 2000; // 2 segundos para processar
        this.isProcessing = true;
        
        // Feedback visual
        this.config.emoji = '⚡';
        this.nameText.setText(`${this.config.emoji} ${this.config.name}`);

        this.scene.time.delayedCall(processingTime, () => {
            this.addItemToStorage(resource.type);
            this.isProcessing = false;
            this.config.emoji = this.getDefaultEmoji();
            this.nameText.setText(`${this.config.emoji} ${this.config.name}`);
            
            // Marca recurso como processado
            resource.isProcessed = true;
            
            // Ganha XP
            this.gainExperience(10);
        });
    }

    getDefaultEmoji() {
        const emojis = {
            'Farmer': '👨‍🌾',
            'Miner': '⛏️',
            'Fisher': '🎣',
            'Lumberjack': '🪓'
        };
        return emojis[this.config.profession] || '👤';
    }

    gainExperience(amount) {
        this.config.xp += amount;

        if (this.config.xp >= this.config.maxXp) {
            this.config.level++;
            this.config.xp = 0;
            this.config.maxXp *= 1.5;

            const levelUpText = this.scene.add.text(
                this.sprite.x,
                this.sprite.y - 50,
                '⭐ Level Up!',
                { fontSize: '20px', fill: '#FFD700' }
            ).setOrigin(0.5);

            this.scene.tweens.add({
                targets: levelUpText,
                y: levelUpText.y - 30,
                alpha: 0,
                duration: 1500,
                onComplete: () => levelUpText.destroy()
            });
        }
    }

    destroy() {
        if (this.movementTimer) {
            this.movementTimer.remove();
        }
        if (this.updateHandler) {
            this.scene.events.off('update', this.updateHandler);
        }
        this.sprite.destroy();
        this.nameText.destroy();
    }

    addItemToStorage(itemType) {
        if (this.inventory[itemType] < this.inventory.maxCapacity) {
            this.inventory[itemType]++;
            
            // Feedback visual
            const text = this.scene.add.text(
                this.sprite.x, 
                this.sprite.y - 40,
                `+1 ${itemType}`, 
                { fontSize: '16px', fill: '#fff' }
            );
            
            this.scene.tweens.add({
                targets: text,
                y: text.y - 30,
                alpha: 0,
                duration: 1000,
                onComplete: () => text.destroy()
            });
            
            return true;
        }
        
        // Feedback de inventário cheio
        const text = this.scene.add.text(
            this.sprite.x,
            this.sprite.y - 40,
            'Inventário cheio!',
            { fontSize: '16px', fill: '#ff0000' }
        );
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
        
        return false;
    }
}