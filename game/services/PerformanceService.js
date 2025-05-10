
export default class PerformanceService {
    constructor(scene) {
        this.scene = scene;
        this.objectPools = new Map();
        this.visibleObjects = new Set();
        this.cullingBounds = new Phaser.Geom.Rectangle();
        this.setupCulling();
    }

    setupCulling() {
        this.scene.events.on('update', this.updateCulling, this);
    }

    initObjectPool(key, initialCount = 10) {
        if (!this.objectPools.has(key)) {
            this.objectPools.set(key, []);
        }

        const pool = this.objectPools.get(key);
        while (pool.length < initialCount) {
            const obj = this.createPoolObject(key);
            pool.push(obj);
        }
    }

    createPoolObject(key) {
        const obj = this.scene.add.sprite(0, 0, key);
        obj.visible = false;
        obj.active = false;
        return obj;
    }

    getFromPool(key) {
        if (!this.objectPools.has(key)) {
            this.initObjectPool(key);
        }

        const pool = this.objectPools.get(key);
        let obj = pool.find(o => !o.active);

        if (!obj) {
            obj = this.createPoolObject(key);
            pool.push(obj);
        }

        obj.active = true;
        obj.visible = true;
        return obj;
    }

    returnToPool(obj) {
        obj.active = false;
        obj.visible = false;
    }

    updateCulling() {
        const camera = this.scene.cameras.main;
        const zoom = camera.zoom;

        this.cullingBounds.setTo(
            camera.scrollX - 100/zoom,
            camera.scrollY - 100/zoom,
            camera.width/zoom + 200,
            camera.height/zoom + 200
        );

        this.scene.children.list.forEach(obj => {
            if (obj.type === 'Sprite' && obj.active) {
                const wasVisible = obj.visible;
                const shouldBeVisible = this.cullingBounds.contains(obj.x, obj.y);

                if (wasVisible !== shouldBeVisible) {
                    obj.visible = shouldBeVisible;
                    if (shouldBeVisible) {
                        this.visibleObjects.add(obj);
                    } else {
                        this.visibleObjects.delete(obj);
                    }
                }
            }
        });
    }

    destroy() {
        this.scene.events.off('update', this.updateCulling, this);
        this.objectPools.clear();
        this.visibleObjects.clear();
    }
}
