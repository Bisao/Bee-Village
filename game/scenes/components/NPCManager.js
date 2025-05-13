
import BaseNPC from './BaseNPC.js';

export default class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.professionEmojis = {
            'Farmer': '🥕',
            'Miner': '⛏️',
            'Fisher': '🎣',
            'Lumberjack': '🪓',
            'Villager': '👤'
        };
        this.professionNames = {
            farmerHouse: {
                prefix: 'Farmer',
                names: ['John', 'Peter', 'Mary', 'Lucas', 'Emma', 'Sofia', 'Miguel', 'Julia']
            },
            FishermanHouse: {
                prefix: 'Fisher',
                names: ['Jack', 'Tom', 'Nina', 'Marco', 'Ana', 'Leo', 'Luna', 'Kai']
            },
            minerHouse: {
                prefix: 'Miner',
                names: ['Max', 'Sam', 'Alex', 'Cole', 'Ruby', 'Jade', 'Rocky', 'Crystal']
            },
            lumberHouse: {
                prefix: 'Lumberjack',
                names: ['Paul', 'Jack', 'Woody', 'Axel', 'Oak', 'Forest', 'Timber', 'Cedar']
            }
        };
        this.usedNames = {};
    }

    async createFarmerNPC(houseX, houseY, worldX, worldY) {
        const buildingKey = `${houseX},${houseY}`;
        const buildingType = this.scene.grid.buildingGrid[buildingKey]?.buildingType;
        const nameData = this.professionNames[buildingType];
        const randomName = nameData ? this.getRandomName(buildingType) : 'Unknown';

        const npcConfig = {
            name: randomName,
            profession: nameData?.prefix || 'Villager',
            emoji: this.getProfessionEmoji(nameData?.prefix),
            spritesheet: 'farmer',
            scale: 0.8,
            movementDelay: 2000,
            tools: this.getToolsForProfession(nameData?.prefix),
            level: 1,
            xp: 0,
            maxXp: 100
        };

        const npc = new BaseNPC(this.scene, houseX, houseY, npcConfig);
        this.scene.grid.buildingGrid[buildingKey].npc = npc;

        const house = this.scene.grid.buildingGrid[buildingKey].sprite;
        if (house) {
            house.setInteractive();
            house.on('pointerdown', () => this.showNPCControls(npc));
        }

        return npc;
    }

    startNPCMovement(npc) {
        if (!npc.isAutonomous) return;

        const firstStep = () => {
            const newY = npc.gridY + 1;
            if (this.scene.grid.isValidPosition(npc.gridX, newY) && !this.scene.isTileOccupied(npc.gridX, newY)) {
                this.moveNPCTo(npc, npc.gridX, newY);
            }
        };

        firstStep();

        const moveNPC = () => {
            if (!npc.isAutonomous || npc.isMoving) return;

            const directions = this.scene.getAvailableDirections(npc.gridX, npc.gridY);
            if (directions.length === 0) return;

            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            this.moveNPCTo(npc, npc.gridX + randomDir.x, npc.gridY + randomDir.y);
        };

        return this.scene.time.addEvent({
            delay: 2000,
            callback: moveNPC,
            loop: true
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
            }.bind(this),
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

    showNPCControls(npc) {
        this.scene.uiManager.showPanel('npcControl', npc);
    }

    enablePlayerControl(npc) {
        this.scene.inputManager.setupNPCControls(npc);
    }

    getProfessionEmoji(profession) {
        return this.professionEmojis[profession] || '👤';
    }

    getRandomName(buildingType) {
        const nameData = this.professionNames[buildingType];
        if (!nameData?.names?.length) {
            return 'Unknown';
        }

        if (!this.usedNames[buildingType]) {
            this.usedNames[buildingType] = new Set();
        }

        const availableNames = nameData.names.filter(name => 
            !this.usedNames[buildingType].has(name)
        );

        if (availableNames.length === 0) {
            this.usedNames[buildingType].clear();
            return this.getRandomName(buildingType);
        }

        const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
        this.usedNames[buildingType].add(randomName);
        return randomName;
    }

    getToolsForProfession(profession) {
        const tools = {
            Farmer: [
                { name: 'Pá', emoji: '🚜', description: 'Usada para arar a terra.' },
                { name: 'Semente', emoji: '🌱', description: 'Usada para plantar.' }
            ],
            Miner: [
                { name: 'Picareta', emoji: '⛏️', description: 'Usada para minerar.' },
                { name: 'Lanterna', emoji: '🔦', description: 'Ilumina áreas escuras.' }
            ],
            Fisher: [
                { name: 'Vara de pesca', emoji: '🎣', description: 'Usada para pescar.' },
                { name: 'Rede', emoji: '🕸️', description: 'Captura peixes em massa.' }
            ],
            Lumberjack: [
                { name: 'Machado', emoji: '🪓', description: 'Usado para cortar árvores.' },
                { name: 'Serra', emoji: '🪚', description: 'Corta madeira mais rápido.' }
            ]
        };
        return tools[profession] || [];
    }
}
