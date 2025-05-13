
export default class ProfessionManager {
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
    }

    getProfessionEmoji(profession) {
        return this.professionEmojis[profession] || '👤';
    }

    getProfessionNames() {
        return this.professionNames;
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
