export default class MovementManager {
    constructor(scene) {
        this.scene = scene;
    }

    moveFarmer(direction, animKey) {
        const newX = this.scene.farmer.gridX + direction.x;
        const newY = this.scene.farmer.gridY + direction.y;
        const {tileX, tileY} = this.scene.grid.gridToIso(newX, newY);

        this.scene.farmer.isMoving = true;
        this.scene.farmer.play(animKey);

        this.scene.tweens.add({
            targets: this.scene.farmer,
            x: this.scene.cameras.main.centerX + tileX,
            y: this.scene.cameras.main.centerY + tileY - 16,
            duration: 600,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                this.scene.farmer.gridX = newX;
                this.scene.farmer.gridY = newY;
                this.scene.farmer.setDepth(newY + 1);
                this.scene.farmer.isMoving = false;
                this.scene.farmer.stop();
                this.scene.events.emit('farmerMoved');
            }
        });
    }

    moveNPCTo(npc, newX, newY) {
        if (npc.isMoving) return;

        const {tileX, tileY} = this.scene.grid.gridToIso(newX, newY);
        npc.isMoving = true;

        let animKey = 'farmer_right';
        if (newY < npc.gridY) animKey = 'farmer_up';
        else if (newY > npc.gridY) animKey = 'farmer_down';
        else if (newX < npc.gridX) animKey = 'farmer_left';

        if (this.scene.anims.exists(animKey)) {
            npc.sprite.play(animKey, true);
        } else {
            npc.sprite.setTexture('farmer1');
        }

        this.scene.tweens.add({
            targets: [npc.sprite, npc.nameText],
            x: this.scene.cameras.main.centerX + tileX,
            y: function (target, key, value, targetIndex) {
                const baseY = this.scene.cameras.main.centerY + tileY;
                return targetIndex === 0 ? baseY - 32 : baseY - 64;
            },
            duration: 600,
            ease: 'Linear',
            onComplete: () => {
                npc.gridX = newX;
                npc.gridY = newY;
                npc.sprite.setDepth(newY + 2);
                npc.isMoving = false;
                npc.sprite.stop();
            }
        });
    }

    moveNPCTo(npc, newX, newY) {
        if (npc.isMoving) return;

        const {tileX, tileY} = this.scene.grid.gridToIso(newX, newY);
        npc.isMoving = true;

        let animKey = 'farmer_right';
        if (newY < npc.gridY) animKey = 'farmer_up';
        else if (newY > npc.gridY) animKey = 'farmer_down';
        else if (newX < npc.gridX) animKey = 'farmer_left';

        if (this.scene.anims.exists(animKey)) {
            npc.sprite.play(animKey, true);
        } else {
            console.warn(`Animation ${animKey} not found`);
            npc.sprite.setTexture('farmer1');
        }

        this.scene.tweens.add({
            targets: [npc.sprite, npc.nameText],
            x: this.scene.cameras.main.centerX + tileX,
            y: function (target, key, value, targetIndex) {
                const baseY = this.scene.cameras.main.centerY + tileY;
                return targetIndex === 0 ? baseY - 32 : baseY - 64;
            },
            duration: 600,
            ease: 'Linear',
            onComplete: () => {
                npc.gridX = newX;
                npc.gridY = newY;
                npc.sprite.setDepth(newY + 2);
                npc.isMoving = false;
                npc.sprite.stop();
            }
        });
    }

    getAvailableDirections(fromX, fromY) {
        const directions = [
            { x: 1, y: 0 },   // direita
            { x: -1, y: 0 },  // esquerda
            { x: 0, y: 1 },   // baixo
            { x: 0, y: -1 }   // cima
        ];

        return directions.filter(dir => {
            const newX = fromX + dir.x;
            const newY = fromY + dir.y;
            return this.scene.grid.isValidPosition(newX, newY) && !this.scene.gridManager.isTileOccupied(newX, newY);
        });
    }

    moveFarmer(direction, animKey) {
        const newX = this.scene.farmer.gridX + direction.x;
        const newY = this.scene.farmer.gridY + direction.y;
        const {tileX, tileY} = this.scene.grid.gridToIso(newX, newY);

        this.scene.farmer.isMoving = true;
        this.scene.farmer.play(animKey);

        this.scene.tweens.add({
            targets: this.scene.farmer,
            x: this.scene.cameras.main.centerX + tileX,
            y: this.scene.cameras.main.centerY + tileY - 16,
            duration: 600,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                this.scene.farmer.gridX = newX;
                this.scene.farmer.gridY = newY;
                this.scene.farmer.setDepth(newY + 1);
                this.scene.farmer.isMoving = false;
                this.scene.farmer.stop();
                this.scene.events.emit('farmerMoved');
            }
        });
    }

    enablePlayerControl(npc) {
        // Remove previous keyboard listeners if they exist
        this.scene.input.keyboard.removeAllListeners('keydown');

        // Create unique controls for this NPC
        npc.controls = this.scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Mobile controls setup
        if (this.scene.inputManager.isMobile) {
            this.setupMobileControls(npc);
        }

        // Create unique update handler for this NPC
        npc.updateHandler = () => {
            if (!npc || npc.isMoving || npc.isAutonomous || this.scene.currentControlledNPC !== npc) return;

            let newX = npc.gridX;
            let newY = npc.gridY;

            if (npc.controls.w.isDown) newY--;
            else if (npc.controls.s.isDown) newY++;
            else if (npc.controls.a.isDown) newX--;
            else if (npc.controls.d.isDown) newX++;

            if (newX !== npc.gridX || newY !== npc.gridY) {
                if (this.scene.gridManager.isValidPosition(newX, newY) && !this.scene.gridManager.isTileOccupied(newX, newY)) {
                    this.moveNPCTo(npc, newX, newY);
                }
            }
        };

        this.scene.events.on('update', npc.updateHandler);
    }

    setupMobileControls(npc) {
        const buttons = {
            'mobile-up': 'w',
            'mobile-down': 's',
            'mobile-left': 'a',
            'mobile-right': 'd'
        };

        Object.keys(buttons).forEach(className => {
            const button = document.querySelector(`.${className}`);
            if (button) {
                button.replaceWith(button.cloneNode(true));
            }
        });

        Object.entries(buttons).forEach(([className, key]) => {
            const button = document.querySelector(`.${className}`);
            if (button) {
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (this.scene.currentControlledNPC === npc) {
                        npc.controls[key].isDown = true;
                    }
                });
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (this.scene.currentControlledNPC === npc) {
                        npc.controls[key].isDown = false;
                    }
                });
            }
        });
    }
}