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

    async createNPC(houseX, houseY, worldX, worldY) {
        const { default: BaseNPC } = await import('./BaseNPC.js');
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
            house.on('pointerdown', () => this.scene.showNPCControls(npc));
        }

        return npc;
    }

    getProfessionEmoji(profession) {
        return this.professionEmojis[profession] || '👤';
    }

    getRandomName(buildingType) {
        const nameData = this.professionNames[buildingType];
        if (!nameData || !nameData.names || nameData.names.length === 0) {
            console.warn(`No names available for building type: ${buildingType}`);
            return 'Unknown';
        }

        if (!this.usedNames[buildingType]) this.usedNames[buildingType] = new Set();

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
        if (!profession) return [];
        
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

    getAvailableJobs(npc) {
        const jobs = [
            { id: 'idle', name: 'Descanso', icon: '☕', description: 'Não faz nada.' }
        ];

        if (npc.config.profession === 'Lumberjack') {
            jobs.push({ 
                id: 'lumber', 
                name: 'Cortar Madeira', 
                icon: '🪓', 
                description: 'Corta árvores e coleta madeira.' 
            });
        }

        return jobs;
    }
}