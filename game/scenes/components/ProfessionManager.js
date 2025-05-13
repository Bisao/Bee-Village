
export default class ProfessionManager {
    constructor(scene) {
        this.scene = scene;
        this.professions = new Map();
        this.initializeProfessions();
    }

    initializeProfessions() {
        this.professions.set('Lumberjack', {
            name: 'Lumberjack',
            emoji: '🪓',
            systemClass: 'LumberSystem',
            tools: [
                { name: 'Machado', emoji: '🪓', description: 'Usado para cortar árvores.' },
                { name: 'Serra', emoji: '🪚', description: 'Corta madeira mais rápido.' }
            ]
        });

        // Add other professions as needed
    }

    async createProfessionSystem(npc, professionName) {
        const profession = this.professions.get(professionName);
        if (!profession) return null;

        const systemModule = await import(`./${profession.systemClass}.js`);
        return new systemModule.default(this.scene);
    }

    getProfessionInfo(professionName) {
        return this.professions.get(professionName);
    }
}
