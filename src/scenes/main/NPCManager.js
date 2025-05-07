
import AnimationController from '../../components/AnimationController.js';

export default class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
        this.animationController = new AnimationController(scene);
    }

    createNPC(config) {
        const npc = {
            sprite: this.scene.add.sprite(config.x, config.y, 'npc1'),
            config: config,
            isMoving: false,
            isAutonomous: true
        };
        
        this.animationController.createNPCAnimations(npc);
        this.npcs.set(config.id, npc);
        return npc;
    }

    updateNPCs() {
        this.npcs.forEach(npc => {
            if (npc.isAutonomous && !npc.isMoving) {
                this.moveRandomly(npc);
            }
        });
    }
}
