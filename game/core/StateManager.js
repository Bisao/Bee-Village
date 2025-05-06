
export default class StateManager {
    constructor() {
        this._gameState = {
            resources: {
                coins: 0,
                wood: 0,
                stone: 0
            },
            buildings: {},
            npcs: {},
            settings: {
                sound: true,
                music: true,
                zoom: 1
            }
        };
        this.listeners = new Map();
    }

    getState() {
        return this._gameState;
    }

    setState(newState) {
        this._gameState = { ...this._gameState, ...newState };
        this.notifyListeners();
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }

    unsubscribe(key, callback) {
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners() {
        for (const callbacks of this.listeners.values()) {
            callbacks.forEach(callback => callback(this._gameState));
        }
    }
}
