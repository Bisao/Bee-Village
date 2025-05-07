
export default class AnimationController {
    constructor(scene) {
        this.scene = scene;
    }

    createNPCAnimations(npc) {
        const directions = ['up', 'down', 'left', 'right'];
        const frameMapping = {
            'up': [1, 2, 3, 4],
            'down': [9, 10, 11, 12],
            'left': [5, 6, 7, 8],
            'right': [1, 2, 3, 4]
        };

        directions.forEach(direction => {
            const frames = this.scene.anims.generateFrameNames('npc', {
                start: frameMapping[direction][0],
                end: frameMapping[direction][3],
                zeroPad: 0,
                prefix: 'npc'
            });

            this.scene.anims.create({
                key: `npc_${direction}`,
                frames: frames,
                frameRate: 8,
                repeat: -1
            });
        });
    }
}
