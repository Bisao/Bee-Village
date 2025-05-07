export default class BaseNPC {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.gridX = x;
        this.gridY = y;
        this.isMoving = false;
        this.isAutonomous = true;
        this.storage = [
            { item: null, quantity: 0 },
            { item: null, quantity: 0 },
            { item: null, quantity: 0 },
            { item: null, quantity: 0 },
            { item: null, quantity: 0 },
            { item: null, quantity: 0 },
            { item: null, quantity: 0 },
            { item: null, quantity: 0 }
        ];

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
            energy: 100,
            maxEnergy: 100,
            isResting: false,
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
                fontSize: '24px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                resolution: 2,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Criar barra de energia
        const barWidth = 50;
        const barHeight = 6;
        this.energyBar = this.scene.add.graphics();
        this.updateEnergyBar = () => {
            this.energyBar.clear();
            const x = worldX - barWidth / 2;
            const y = worldY - 52;
            
            // Barra de fundo
            this.energyBar.fillStyle(0x000000, 0.5);
            this.energyBar.fillRect(x, y, barWidth, barHeight);
            
            // Calcula cor baseada na energia (amarelo -> vermelho)
            const energyRatio = this.config.energy / this.config.maxEnergy;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(0xff0000),
                Phaser.Display.Color.ValueToColor(0xffff00),
                100,
                energyRatio * 100
            );
            
            // Barra de energia
            this.energyBar.fillStyle(color.color, 1);
            this.energyBar.fillRect(x, y, barWidth * energyRatio, barHeight);
        };
        this.updateEnergyBar();
        this.energyBar.setDepth(1000);

        // Timer para consumo de energia
        this.energyTimer = this.scene.time.addEvent({
            delay: 20000,
            callback: () => {
                if (!this.config.isResting && this.config.energy > 0) {
                    this.config.energy = Math.max(0, this.config.energy - 1);
                    this.updateEnergyBar();

                    // Verifica se precisa descansar
                    if (this.config.energy <= 25) {
                        this.rest();
                    }
                }
            },
            loop: true
        });

        // Ajusta escala inicial
        const baseScale = 0.6;
        this.nameText.setScale(baseScale / this.scene.cameras.main.zoom);

        // Update text scale when zoom changes
        this.scene.cameras.main.on('zoom', (zoom) => {
            if (this.nameText) {
                this.nameText.setScale(baseScale / zoom);
            }
        });
        this.nameText.setDepth(1000); // Valor alto para garantir que fique acima de tudo

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
        const html = `
            <div class="modal-content">
                <button class="close-button">✕</button>
                <div class="npc-header">
                    <div class="npc-avatar">
                        ${this.config.emoji}
                    </div>
                    <div class="npc-info">
                        <h3>${this.config.name}</h3>
                        <p class="npc-profession">${this.config.profession}</p>
                        <div class="npc-level-info">
                            <span class="level-text">Nível ${this.config.level}</span>
                            <div class="xp-bar">
                                <div class="xp-progress" style="width: ${(this.config.xp / this.config.maxXp) * 100}%"></div>
                            </div>
                            <span class="xp-text">${this.config.xp}/${this.config.maxXp} XP</span>
                        </div>
                    </div>
                </div>

                <div class="npc-tabs">
                    <button class="npc-tab active" data-tab="inventory">Inventário</button>
                    <button class="npc-tab" data-tab="work">Trabalhos</button>
                    <button class="npc-tab" data-tab="skills">Skills</button>
                </div>

                <div class="tab-panel inventory-panel active" id="inventory-panel">
                    <div class="equipment-section">
                        <h4>Equipamentos</h4>
                        <div class="inventory-grid">
                            ${this.config.tools.map(tool => `
                                <div class="tool-slot">
                                    <div class="tool-emoji">${tool.emoji}</div>
                                    <div class="tool-name">${tool.name}</div>
                                    <div class="tool-description">${tool.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="storage-section">
                        <h4>Armazenamento</h4>
                        <div class="storage-grid">
                            ${this.storage.map(slot => `
                                <div class="storage-slot">
                                    ${slot.item ? `
                                        <div class="storage-item">
                                            <span class="item-emoji">${this.getItemEmoji(slot.item)}</span>
                                            <span class="item-quantity">${slot.quantity}/10</span>
                                        </div>
                                    ` : '<div class="storage-empty">📦</div>'}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="tab-panel work-panel" id="work-panel">
                    <div class="work-list">
                        ${this.getWorksByProfession()}
                    </div>
                </div>

                <div class="control-buttons">
                    <button class="control-btn ${this.isAutonomous ? 'active' : ''}" id="autonomous">
                        🤖 Modo Autônomo
                    </button>
                    <button class="control-btn ${!this.isAutonomous ? 'active' : ''}" id="controlled">
                        🕹️ Modo Controlado
                    </button>
                </div>
            </div>
        `;
        this.scene.showInventory(html); //Assumes a showInventory method exists in the scene
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
                { name: 'Coletor', emoji: '🧺', description: 'Para coletar recursos' },
                { name: 'Escopeta', emoji: '🔫', description: 'Para defesa da fazenda' },
                { name: 'Sementes', emoji: '🌱', description: 'Para plantar culturas' }
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

    findAndPlant() {
        // Remover timer anterior se existir
        if (this.searchTimer) {
            this.searchTimer.remove();
            this.searchTimer = null;
        }

        const originalEmoji = this.config.emoji;
        this.config.emoji = '👁️‍🗨️';
        this.nameText.setText(`${this.config.emoji} ${this.config.name}`);

        console.log(`[${this.config.name}] Procurando local para plantar...`);

        // Procura por tiles disponíveis ao redor da posição atual
        let availableTiles = [];
        const adjacentPositions = [
            {x: this.gridX, y: this.gridY},     // Posição atual
            {x: this.gridX + 1, y: this.gridY}, // Direita
            {x: this.gridX - 1, y: this.gridY}, // Esquerda
            {x: this.gridX, y: this.gridY + 1}, // Baixo
            {x: this.gridX, y: this.gridY - 1}  // Cima
        ];

        for (const pos of adjacentPositions) {
            if (this.scene.grid.isValidPosition(pos.x, pos.y) && !this.scene.isTileOccupied(pos.x, pos.y)) {
                availableTiles.push(pos);
            }
        }

        if (availableTiles.length === 0) {
            console.log(`[${this.config.name}] Nenhum local adequado encontrado para plantar.`);
            this.config.emoji = originalEmoji;
            this.nameText.setText(`${this.config.emoji} ${this.config.name}`);
            return;
        }

        // Configurar novo timer de plantio
        this.searchTimer = this.scene.time.addEvent({
            delay: this.config.movementDelay,
            callback: () => {
                if (!this.isMoving && this.isAutonomous) {
                    const foundTile = Phaser.Math.RND.pick(availableTiles);
                    console.log(`[${this.config.name}] Local para plantar encontrado em (${foundTile.x}, ${foundTile.y})`);
                    this.moveTo(foundTile.x, foundTile.y);
                }
            },
            loop: true
        });

        // Define tempo de busca entre 5-8 segundos
        const searchTime = Phaser.Math.Between(5000, 8000);

        // Animação de busca
        const searchParticles = this.scene.add.particles(0, 0, 'tile_grass', {
            x: this.sprite.x,
            y: this.sprite.y,
            speed: { min: 20, max: 50 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            quantity: 1,
            frequency: 200
        });

        // Após o tempo de busca, escolhe um tile e planta
        this.scene.time.delayedCall(searchTime, () => {
            searchParticles.destroy();
            const foundTile = Phaser.Math.RND.pick(availableTiles);

            console.log(`[${this.config.name}] Local para plantar encontrado em (${foundTile.x}, ${foundTile.y})`);

            // Move o NPC até o tile encontrado
            this.moveTo(foundTile.x, foundTile.y);

            // Quando chegar no destino, inicia o plantio
            this.scene.time.delayedCall(600, () => { // 600ms é o tempo da animação de movimento
                if (this.gridX === foundTile.x && this.gridY === foundTile.y) {
                    // Animação de plantio (5 segundos)
                    this.config.emoji = '🌱';
                    this.nameText.setText(`${this.config.emoji} ${this.config.name}`);

                    const {tileX, tileY} = this.scene.grid.gridToIso(foundTile.x, foundTile.y);
                    const worldX = this.scene.cameras.main.centerX + tileX;
                    const worldY = this.scene.cameras.main.centerY + tileY;

                    const particles = this.scene.add.particles(0, 0, 'tile_grass', {
                        x: worldX,
                        y: worldY - 16,
                        speed: { min: 50, max: 100 },
                        scale: { start: 0.2, end: 0 },
                        alpha: { start: 0.6, end: 0 },
                        lifespan: 800,
                        blendMode: 'ADD',
                        quantity: 10,
                        emitting: false
                    });

                    particles.start();

                    // Após 0.5 segundos, finaliza o plantio
                    this.scene.time.delayedCall(500, () => {
                        this.scene.plant(foundTile.x, foundTile.y);
                        particles.destroy();
                        this.config.emoji = originalEmoji;
                        this.nameText.setText(`${this.config.emoji} ${this.config.name}`);
                        console.log(`[${this.config.name}] Plantação realizada com sucesso!`);
                    });
                }
            });
        });
    }


    getItemEmoji(item) {
        const emojis = {
            'potato': '🥔',
            'carrot': '🥕',
            'wheat': '🌾',
            'berry': '🫐',
            'mushroom': '🍄',
            'worm': '🪱',
            'bug': '🐛'
        };
        return emojis[item] || '❓';
    }

    startCollecting() {
        this.scene.collectionSystem.startCollecting(this);
    }

    addItemToStorage(item) {
        // Procura um slot com o mesmo item e espaço
        let slot = this.storage.find(s => s.item === item && s.quantity < 10);
        if (slot) {
            slot.quantity++;
            return true;
        }

        // Procura um slot vazio
        slot = this.storage.find(s => !s.item);
        if (slot) {
            slot.item = item;
            slot.quantity = 1;
            return true;
        }

        return false; // Inventário cheio
    }

    getWorksByProfession() {
        switch (this.config.profession) {
            case 'Farmer':
                return `
                    <div class="work-item" id="plant-work">
                        <span>🌾 Plantar</span>
                    </div>
                    <div class="work-item">
                        <span>🚿 Regar Plantas</span>
                    </div>
                    <div class="work-item">
                        <span>🌟 Colher</span>
                    </div>
                `;
            case 'Miner':
                return `
                    <div class="work-item">
                        <span>⛏️ Minerar</span>
                    </div>
                    <div class="work-item">
                        <span>🚧 Construir Túnel</span>
                    </div>
                `;
            case 'Fisher':
                return `
                    <div class="work-item">
                        <span>🎣 Pescar</span>
                    </div>
                    <div class="work-item">
                        <span>🐠 Limpar Peixes</span>
                    </div>
                `;
            default:
                return '<div class="work-item"><span>Sem trabalhos disponíveis</span></div>';
        }
    }

    rest() {
        this.config.isResting = true;
        this.config.emoji = '💤';
        this.nameText.setText(`${this.config.emoji} ${this.config.name}`);
        
        // Volta para casa
        const key = `${this.gridX},${this.gridY}`;
        const house = this.scene.grid.buildingGrid[key];
        if (house && house.type === 'building') {
            // Já está em casa
            this.startResting();
        } else {
            // Procura a casa do NPC
            for (const [pos, building] of Object.entries(this.scene.grid.buildingGrid)) {
                if (building.npc === this) {
                    const [x, y] = pos.split(',').map(Number);
                    this.moveTo(x, y);
                    this.scene.time.delayedCall(1000, () => this.startResting());
                    break;
                }
            }
        }
    }

    startResting() {
        this.sprite.setVisible(false);
        this.scene.time.delayedCall(120000, () => { // 2 minutos
            this.config.energy = this.config.maxEnergy;
            this.config.isResting = false;
            this.config.emoji = this.getProfessionEmoji(this.config.profession);
            this.nameText.setText(`${this.config.emoji} ${this.config.name}`);
            this.updateEnergyBar();
            this.sprite.setVisible(true);
        });
    }

    destroy() {
        if (this.searchTimer) {
            this.searchTimer.remove();
        }
        if (this.energyTimer) {
            this.energyTimer.remove();
        }
        this.sprite.destroy();
        this.nameText.destroy();
        this.energyBar.destroy();
    }
}