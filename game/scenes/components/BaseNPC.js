
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
        this.scene.time.addEvent({
            delay: this.config.movementDelay,
            callback: () => this.moveRandomly(),
            loop: true
        });
    }

    moveRandomly() {
        if (!this.isAutonomous || this.isMoving) return;

        // Sistema de memória de posições visitadas
        this.visitedPositions = this.visitedPositions || new Map();
        const key = `${this.gridX},${this.gridY}`;
        this.visitedPositions.set(key, (this.visitedPositions.get(key) || 0) + 1);

        const directions = this.scene.getAvailableDirections(this.gridX, this.gridY);
        if (directions.length === 0) {
            this.scene.time.delayedCall(1000, () => this.moveRandomly());
            return;
        }

        // Avaliar cada direção possível
        const scoredDirections = directions.map(dir => {
            const newX = this.gridX + dir.x;
            const newY = this.gridY + dir.y;
            const newKey = `${newX},${newY}`;
            
            let score = 0;
            // Evitar voltar para posição anterior
            if (this.lastPosition && this.lastPosition.x === newX && this.lastPosition.y === newY) {
                score -= 5;
            }
            
            // Preferir posições menos visitadas
            const visits = this.visitedPositions.get(newKey) || 0;
            score -= visits * 2;
            
            // Evitar ficar muito tempo em uma área
            if (this.currentAreaTime > 10000) { // 10 segundos
                score += Math.random() * 3; // Adiciona aleatoriedade para exploração
            }
            
            // Verificar objetivos próximos (árvores, recursos, etc)
            if (this.config.profession === 'Lumberjack') {
                const nearbyTrees = this.findNearbyTrees(newX, newY, 3);
                score += nearbyTrees.length * 2;
            }
            
            return { dir, score };
        });

        // Escolher direção com maior pontuação
        scoredDirections.sort((a, b) => b.score - a.score);
        const bestDirection = scoredDirections[0].dir;

        // Atualizar estado
        this.lastPosition = { x: this.gridX, y: this.gridY };
        this.currentAreaTime = (this.currentAreaTime || 0) + 1000;
        
        // Executar movimento
        this.moveTo(this.gridX + bestDirection.x, this.gridY + bestDirection.y);
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
}
