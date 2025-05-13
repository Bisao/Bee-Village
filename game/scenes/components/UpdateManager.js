
export default class UpdateManager {
    constructor(scene) {
        this.scene = scene;
        this.managers = new Set();
    }

    registerManager(manager) {
        if (manager.update) {
            this.managers.add(manager);
        }
    }

    unregisterManager(manager) {
        this.managers.delete(manager);
    }

    update() {
        this.managers.forEach(manager => {
            if (manager.update) {
                manager.update();
            }
        });
    }
}
