
export default class AnimationManager {
    constructor(scene) {
        this.scene = scene;
    }

    createFarmerAnimations() {
        const frames = [];
        for (let i = 1; i <= 12; i++) {
            const key = `farmer${i}`;
            if (!this.scene.textures.exists(key)) {
                this.scene.load.image(key, `game/assets/shared/Farmer_${i}-ezgif.com-resize.png`);
            }
            frames.push({ key });
        }

        this.scene.load.once('complete', () => {
            this.scene.anims.create({
                key: 'farmer_walk',
                frames: frames,
                frameRate: 8,
                repeat: -1
            });

            this.createDirectionalAnimations();
        });

        this.scene.load.start();
    }

    createDirectionalAnimations() {
        const directions = {
            up: [1, 2, 3, 4],
            down: [9, 10, 11, 12],
            left: [5, 6, 7, 8],
            right: [1, 2, 3, 4]
        };

        Object.entries(directions).forEach(([direction, frameNumbers]) => {
            this.scene.anims.create({
                key: `farmer_${direction}`,
                frames: frameNumbers.map(num => ({ key: `farmer${num}` })),
                frameRate: 8,
                repeat: -1
            });
        });
    }
}
