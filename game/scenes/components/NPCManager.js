export default class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
        this.usedNames = new Map();
        this.farmerCreated = false;
    }

    createFarmer() {
        if (this.farmerCreated) return;
        this.farmerCreated = true;
        this.scene.animationManager.createFarmerAnimations();
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