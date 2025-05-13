
export default class StateManager {
    constructor(scene) {
        this.scene = scene;
        this.state = {
            resources: {},
            buildings: {},
            npcs: {},
            currentMode: 'build', // build, manage, etc
            selectedBuilding: null,
            paused: false
        };
        this.listeners = new Map();
    }

    setState(key, value) {
        this.state[key] = value;
        this.notifyListeners(key);
    }

    getState(key) {
        return this.state[key];
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
    }

    unsubscribe(key, callback) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).delete(callback);
        }
    }

    notifyListeners(key) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(this.state[key]);
            });
        }
    }
}
