
export default class ProfessionManager {
    constructor() {
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

    getProfessionEmoji(profession) {
        return this.professionEmojis[profession] || '👤';
    }

    getRandomName(buildingType) {
        const nameData = this.professionNames[buildingType];
        if (!nameData || !nameData.names || nameData.names.length === 0) {
            console.warn(`No names available for building type: ${buildingType}`);
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
        switch (profession) {
            case 'Farmer':
                return [
                    { name: 'Pá', emoji: '🚜', description: 'Usada para arar a terra.' },
                    { name: 'Semente', emoji: '🌱', description: 'Usada para plantar.' }
                ];
            case 'Miner':
                return [
                    { name: 'Picareta', emoji: '⛏️', description: 'Usada para minerar.' },
                    { name: 'Lanterna', emoji: '🔦', description: 'Ilumina áreas escuras.' }
                ];
            case 'Fisher':
                return [
                    { name: 'Vara de pesca', emoji: '🎣', description: 'Usada para pescar.' },
                    { name: 'Rede', emoji: '🕸️', description: 'Captura peixes em massa.' }
                ];
            case 'Lumberjack':
                return [
                    { name: 'Machado', emoji: '🪓', description: 'Usado para cortar árvores.' },
                    { name: 'Serra', emoji: '🪚', description: 'Corta madeira mais rápido.' }
                ];
            default:
                return [];
        }
    }
}
