
export default class MemoryManager {
    constructor(scene) {
        this.scene = scene;
        this.events = new Set();
        this.intervals = new Set();
        this.timeouts = new Set();
    }

    registerEvent(target, eventName, handler) {
        target.on(eventName, handler);
        this.events.add(() => target.off(eventName, handler));
    }

    setInterval(callback, delay) {
        const interval = setInterval(callback, delay);
        this.intervals.add(interval);
        return interval;
    }

    setTimeout(callback, delay) {
        const timeout = setTimeout(callback, delay);
        this.timeouts.add(timeout);
        return timeout;
    }

    cleanup() {
        // Limpa eventos
        this.events.forEach(cleanup => cleanup());
        this.events.clear();

        // Limpa intervalos
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();

        // Limpa timeouts
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts.clear();
    }
}
