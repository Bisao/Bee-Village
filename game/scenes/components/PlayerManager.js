
export default class PlayerManager {
    constructor(scene) {
        this.scene = scene;
    }

    enablePlayerControl(npc) {
        // Remove previous keyboard listeners
        this.scene.input.keyboard.removeAllListeners('keydown');

        // Create unique controls for this NPC
        npc.controls = this.scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Setup mobile controls if needed
        if (this.scene.inputManager.isMobile) {
            this.setupMobileControls(npc);
        }

        // Create update handler
        this.setupUpdateHandler(npc);
    }

    setupMobileControls(npc) {
        const buttons = {
            'mobile-up': 'w',
            'mobile-down': 's',
            'mobile-left': 'a',
            'mobile-right': 'd'
        };

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

    setupUpdateHandler(npc) {
        npc.updateHandler = () => {
            if (!npc || npc.isMoving || npc.isAutonomous || this.scene.currentControlledNPC !== npc) return;

            let newX = npc.gridX;
            let newY = npc.gridY;

            if (npc.controls.w.isDown) newY--;
            else if (npc.controls.s.isDown) newY++;
            else if (npc.controls.a.isDown) newX--;
            else if (npc.controls.d.isDown) newX++;

            if (newX !== npc.gridX || newY !== npc.gridY) {
                if (this.scene.grid.isValidPosition(newX, newY) && !this.scene.isTileOccupied(newX, newY)) {
                    this.scene.moveNPCTo(npc, newX, newY);
                }
            }
        };

        this.scene.events.on('update', npc.updateHandler);
    }
}
