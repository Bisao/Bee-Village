export default class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
        this.usedNames = new Map();
        this.professionEmojis = {
            'Farmer': '🥕',
            'Miner': '⛏️',
            'Fisher': '🎣',
            'Lumberjack': '🪓',
            'Villager': '👤'
        };
    }

    enablePlayerControl(npc) {
        this.cleanupNPCControls();
        
        npc.controls = this.scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });

        if (this.scene.inputManager.isMobile) {
            this.setupMobileControls(npc);
        }

        npc.updateHandler = () => {
            if (!npc || npc.isMoving || npc.isAutonomous) return;

            let newX = npc.gridX;
            let newY = npc.gridY;

            if (npc.controls.w.isDown) newY--;
            else if (npc.controls.s.isDown) newY++;
            else if (npc.controls.a.isDown) newX--;
            else if (npc.controls.d.isDown) newX++;

            if (newX !== npc.gridX || newY !== npc.gridY) {
                if (this.scene.grid.isValidPosition(newX, newY) && !this.scene.grid.isTileOccupied(newX, newY)) {
                    this.scene.movementManager.moveNPCTo(npc, newX, newY);
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

        Object.entries(buttons).forEach(([className, key]) => {
            const button = document.querySelector(`.${className}`);
            if (button) {
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    npc.controls[key].isDown = true;
                });
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    npc.controls[key].isDown = false;
                });
            }
        });
    }

    cleanupNPCControls() {
        if (this.scene.currentControlledNPC) {
            const previousNPC = this.scene.currentControlledNPC;
            previousNPC.isAutonomous = true;

            if (previousNPC.movementTimer) {
                previousNPC.movementTimer.remove();
            }

            if (previousNPC.controls) {
                Object.values(previousNPC.controls).forEach(key => key.destroy());
                previousNPC.controls = null;
            }

            if (previousNPC.updateHandler) {
                this.scene.events.off('update', previousNPC.updateHandler);
                previousNPC.updateHandler = null;
            }

            this.scene.currentControlledNPC = null;

            this.scene.time.delayedCall(100, () => {
                this.startNPCMovement(previousNPC);
            });
        }
    }

    async createFarmerNPC(houseX, houseY, worldX, worldY) {
        const BaseNPC = (await import('./BaseNPC.js')).default;

        const buildingKey = `${houseX},${houseY}`;
        const buildingType = this.scene.grid.buildingGrid[buildingKey]?.buildingType;
        const nameData = this.scene.professionManager.getProfessionNames()[buildingType];
        const randomName = nameData ? this.getRandomName(buildingType) : 'Unknown';

        const npcConfig = {
            name: randomName,
            profession: nameData?.prefix || 'Villager',
            emoji: this.scene.professionManager.getProfessionEmoji(nameData?.prefix),
            spritesheet: 'farmer',
            scale: 0.8,
            movementDelay: 2000,
            tools: this.scene.professionManager.getToolsForProfession(nameData?.prefix),
            level: 1,
            xp: 0,
            maxXp: 100
        };

        const npc = new BaseNPC(this.scene, houseX, houseY, npcConfig);
        this.npcs.set(buildingKey, npc);

        const house = this.scene.grid.buildingGrid[buildingKey].sprite;
        if (house) {
            house.setInteractive();
            house.on('pointerdown', () => this.scene.uiManager.showNPCControls(npc));
        }

        return npc;
    }

    startNPCMovement(npc) {
        if (!npc.isAutonomous) return;

        const firstStep = () => {
            const newY = npc.gridY + 1;
            if (this.scene.gridManager.isValidPosition(npc.gridX, newY) && 
                !this.scene.gridManager.isTileOccupied(npc.gridX, newY)) {
                this.scene.movementManager.moveNPCTo(npc, npc.gridX, newY);
            }
        };

        firstStep();

        const moveNPC = () => {
            if (!npc.isAutonomous || npc.isMoving) return;

            const directions = this.scene.gridManager.getAvailableDirections(npc.gridX, npc.gridY);
            if (directions.length === 0) return;

            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            this.scene.movementManager.moveNPCTo(npc, npc.gridX + randomDir.x, npc.gridY + randomDir.y);
        };

        this.scene.time.addEvent({
            delay: 2000,
            callback: moveNPC,
            loop: true
        });
    }

    getRandomName(buildingType) {
        const nameData = this.scene.professionManager.getProfessionNames()[buildingType];
        if (!nameData?.names?.length) {
            console.warn(`No names available for building type: ${buildingType}`);
            return 'Unknown';
        }

        if (!this.usedNames.has(buildingType)) {
            this.usedNames.set(buildingType, new Set());
        }

        const usedNamesForType = this.usedNames.get(buildingType);
        const availableNames = nameData.names.filter(name => !usedNamesForType.has(name));

        if (availableNames.length === 0) {
            usedNamesForType.clear();
            return this.getRandomName(buildingType);
        }

        const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
        usedNamesForType.add(randomName);
        return randomName;
    }
}