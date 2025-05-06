
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
            ...config
        };

        this.init();
    }

    init() {
        const {tileX, tileY} = this.scene.grid.gridToIso(this.gridX, this.gridY);
        const worldX = this.scene.cameras.main.centerX + tileX;
        const worldY = this.scene.cameras.main.centerY + tileY;

        // Criar sprite
        this.sprite = this.scene.add.sprite(worldX, worldY - 32, `${this.config.spritesheet}1`);
        this.sprite.setScale(this.config.scale);
        this.sprite.setDepth(this.gridY + 2);
        this.sprite.setInteractive();

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
        
        if (this.isAutonomous) {
            this.startAutonomousMovement();
        }
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

        const directions = this.scene.getAvailableDirections(this.gridX, this.gridY);
        if (directions.length === 0) return;

        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        this.moveTo(this.gridX + randomDir.x, this.gridY + randomDir.y);
    }

    moveTo(newX, newY) {
        if (this.isMoving) return;

        const {tileX, tileY} = this.scene.grid.gridToIso(newX, newY);
        this.isMoving = true;

        // Determina direção da animação
        let animKey = `${this.config.spritesheet}_right`;
        if (newY < this.gridY) animKey = `${this.config.spritesheet}_up`;
        else if (newY > this.gridY) animKey = `${this.config.spritesheet}_down`;
        else if (newX < this.gridX) animKey = `${this.config.spritesheet}_left`;

        // Toca animação
        if (this.scene.anims.exists(animKey)) {
            this.sprite.play(animKey);
        }

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
            }
        });
    }

    destroy() {
        this.sprite.destroy();
        this.nameText.destroy();
    }
}
