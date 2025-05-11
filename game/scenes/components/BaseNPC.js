
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
        // Inventário do NPC
        this.inventory = {
            wood: 0,
            maxCapacity: 5
        };
        
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
        this.sprite.setVisible(false);
        this.homePosition = { x: this.gridX, y: this.gridY };
    }

    leaveHouse() {
        const newY = this.gridY + 1;
        if (this.scene.grid.isValidPosition(this.gridX, newY) && 
            !this.scene.isTileOccupied(this.gridX, newY)) {
            this.moveTo(this.gridX, newY);
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: { from: 0, to: 1 },
                duration: 500,
                onStart: () => this.sprite.setVisible(true)
            });
            return true;
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

    showControls() {
        this.scene.showNPCControls(this);
    }

    startAutonomousMovement() {
        if (!this.isAutonomous) return;

        if (this.currentJob === 'lumber') {
            // Continua o trabalho de lenhador
            return;
        }

        // Se não está trabalhando, volta para casa
        this.returnHome();
    }

    setRestMode(enabled) {
        if (enabled) {
            // Finaliza o trabalho atual
            if (this.currentJob === 'lumber') {
                const lumberSystem = this.scene.lumberSystem;
                if (lumberSystem) {
                    lumberSystem.stopWorking();
                }
            }
            
            // Retorna para casa
            this.returnHome();
            this.currentJob = 'rest';
        } else {
            this.currentJob = null;
        }
    }

    findNearbyTrees(x, y, radius) {
        const trees = [];
        for (const [key, value] of Object.entries(this.scene.grid.buildingGrid)) {
            if (value.type === 'tree' && !value.isCut) {
                const [treeX, treeY] = key.split(',').map(Number);
                const distance = Math.abs(x - treeX) + Math.abs(y - treeY);
                if (distance <= radius) {
                    trees.push({ x: treeX, y: treeY, distance });
                }
            }
        }
        return trees;
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

                // Adiciona uma pequena animação de "bounce" ao parar
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

    destroy() {
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

    hasInventorySpace(itemType) {
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
        
        // Level up se atingir XP máximo
        if (this.config.xp >= this.config.maxXp) {
            this.config.level++;
            this.config.xp = 0;
            this.config.maxXp *= 1.5;
            
            // Feedback visual de level up
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
}
