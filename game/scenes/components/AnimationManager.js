
export default class AnimationManager {
    constructor(scene) {
        this.scene = scene;
    }

    createFarmerAnimations() {
        const frames = [];
        for (let i = 1; i <= 12; i++) {
            frames.push({ key: `farmer${i}` });
        }

        this.scene.anims.create({
            key: 'farmer_walk',
            frames: frames,
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'farmer_up',
            frames: [
                { key: 'farmer1' },
                { key: 'farmer2' },
                { key: 'farmer3' },
                { key: 'farmer4' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'farmer_down',
            frames: [
                { key: 'farmer9' },
                { key: 'farmer10' },
                { key: 'farmer11' },
                { key: 'farmer12' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'farmer_left',
            frames: [
                { key: 'farmer5' },
                { key: 'farmer6' },
                { key: 'farmer7' },
                { key: 'farmer8' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'farmer_right',
            frames: [
                { key: 'farmer1' },
                { key: 'farmer2' },
                { key: 'farmer3' },
                { key: 'farmer4' }
            ],
            frameRate: 8,
            repeat: -1
        });
    }
}
