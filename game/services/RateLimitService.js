
export default class RateLimitService {
    constructor() {
        this.limits = new Map();
        this.defaultCooldown = 1000; // 1 segundo
    }

    setLimit(action, cooldown) {
        this.limits.set(action, {
            cooldown,
            lastExecuted: 0,
            count: 0
        });
    }

    canExecute(action) {
        const limit = this.limits.get(action) || { 
            cooldown: this.defaultCooldown,
            lastExecuted: 0,
            count: 0
        };

        const now = Date.now();
        if (now - limit.lastExecuted < limit.cooldown) {
            return false;
        }

        limit.lastExecuted = now;
        limit.count++;
        this.limits.set(action, limit);
        return true;
    }

    resetLimit(action) {
        this.limits.delete(action);
    }
}
