
export default class ExperienceSystem {
    constructor(scene) {
        this.scene = scene;
        this.experienceData = new Map();
        this.levelThresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
    }

    initializeNPC(npcId, profession) {
        this.experienceData.set(npcId, {
            xp: 0,
            level: 1,
            profession: profession,
            skills: this.getInitialSkills(profession)
        });
    }

    getInitialSkills(profession) {
        const skills = {
            'Farmer': {
                planting: 1,
                harvesting: 1,
                waterManagement: 1
            },
            'Miner': {
                mining: 1,
                prospecting: 1,
                caveExploration: 1
            },
            'Fisher': {
                fishing: 1,
                navigation: 1,
                netCasting: 1
            }
        };
        return skills[profession] || {};
    }

    addExperience(npcId, amount) {
        const data = this.experienceData.get(npcId);
        if (data) {
            data.xp += amount;
            this.checkLevelUp(npcId);
            this.scene.events.emit('experienceGained', { npcId, amount });
        }
    }

    checkLevelUp(npcId) {
        const data = this.experienceData.get(npcId);
        if (!data) return;

        const currentLevel = data.level;
        const newLevel = this.calculateLevel(data.xp);

        if (newLevel > currentLevel) {
            data.level = newLevel;
            this.improveSkills(npcId);
            this.scene.events.emit('levelUp', { npcId, level: newLevel });
        }
    }

    calculateLevel(xp) {
        return this.levelThresholds.findIndex(threshold => xp < threshold) || this.levelThresholds.length;
    }

    improveSkills(npcId) {
        const data = this.experienceData.get(npcId);
        if (!data) return;

        Object.keys(data.skills).forEach(skill => {
            if (Math.random() < 0.5) {
                data.skills[skill] += 1;
            }
        });
    }

    getStats(npcId) {
        return this.experienceData.get(npcId);
    }
}
