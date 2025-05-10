
export default class PerformanceService {
    constructor(scene) {
        this.scene = scene;
        this.objectPool = new Map();
        this.cullingBounds = new Phaser.Geom.Rectangle();
    }

    initObjectPool(key, count) {
        const pool = [];
        for (let i = 0; i < count; i++) {
            const obj = this.scene.add.sprite(0, 0, key);
            obj.visible = false;
            pool.push(obj);
        }
        this.objectPool.set(key, pool);
    }

    getFromPool(key) {
        const pool = this.objectPool.get(key);
        return pool?.find(obj => !obj.visible) || null;
    }

    updateCulling() {
        const camera = this.scene.cameras.main;
        this.cullingBounds.setTo(
            camera.scrollX - 100,
            camera.scrollY - 100,
            camera.width + 200,
            camera.height + 200
        );

        this.scene.children.list.forEach(obj => {
            if (obj.type === 'Sprite') {
                obj.visible = this.cullingBounds.contains(obj.x, obj.y);
            }
        });
    }
}
