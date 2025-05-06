
import { GameConfig } from '../../config/GameConfig.js';

export default class BaseNPC {
    constructor(scene, gridX, gridY, profession) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.profession = profession;
        this.isMoving = false;
        this.isAutonomous = true;
        this.name = this.generateName();
    }

    create(worldX, worldY) {
        this.sprite = this.scene.add.sprite(worldX, worldY - 32, 'farmer1');
        this.sprite.setScale(GameConfig.npcs.scale);
        this.sprite.setDepth(this.gridY + 2);

        this.nameText = this.scene.add.text(worldX, worldY - 64, this.getFullName(), {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            resolution: 2
        }).setOrigin(0.5);
        this.nameText.setDepth(this.gridY + 3);

        this.setupInteractions();
        this.startAutonomousMovement();
    }

    setupInteractions() {
        this.sprite.setInteractive();
        this.sprite.on('pointerdown', () => this.showControls());
    }

    showControls() {
        this.scene.showNPCControls(this);
    }

    startAutonomousMovement() {
        if (!this.isAutonomous) return;
        
        this.scene.time.addEvent({
            delay: 2000,
            callback: this.moveRandomly,
            callbackScope: this,
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

        const animKey = this.getAnimationKey(newX, newY);
        if (this.scene.anims.exists(animKey)) {
            this.sprite.play(animKey, true);
        }

        this.scene.tweens.add({
            targets: [this.sprite, this.nameText],
            x: this.scene.cameras.main.centerX + tileX,
            y: (target, key, value, targetIndex) => {
                const baseY = this.scene.cameras.main.centerY + tileY;
                return targetIndex === 0 ? baseY - 32 : baseY - 64;
            },
            duration: GameConfig.npcs.movementSpeed,
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

    getAnimationKey(newX, newY) {
        if (newY < this.gridY) return 'farmer_up';
        if (newY > this.gridY) return 'farmer_down';
        return newX < this.gridX ? 'farmer_left' : 'farmer_right';
    }

    generateName() {
        const professionData = this.scene.professionNames[this.profession];
        if (!professionData?.names?.length) return 'Unknown';
        
        const availableNames = professionData.names.filter(name => 
            !this.scene.usedNames?.[this.profession]?.has(name)
        );
        
        if (availableNames.length === 0) {
            this.scene.usedNames[this.profession]?.clear();
            return this.generateName();
        }
        
        const name = availableNames[Math.floor(Math.random() * availableNames.length)];
        if (!this.scene.usedNames[this.profession]) {
            this.scene.usedNames[this.profession] = new Set();
        }
        this.scene.usedNames[this.profession].add(name);
        return name;
    }

    getFullName() {
        const professionEmojis = {
            'farmerHouse': '🥕',
            'minerHouse': '⛏️',
            'fishermanHouse': '🎣'
        };
        const emoji = professionEmojis[this.profession] || '👤';
        return `${emoji} ${this.name}`;
    }

    destroy() {
        this.sprite.destroy();
        this.nameText.destroy();
    }
}
