
export default class RateLimitService {
    constructor() {
        this.limits = new Map();
        this.defaultCooldown = 1000; // 1 segundo
        this.actionCounts = new Map();
        this.windowSize = 60000; // 1 minuto
    }

    setLimit(action, options = {}) {
        this.limits.set(action, {
            cooldown: options.cooldown || this.defaultCooldown,
            maxRequests: options.maxRequests || 60,
            lastExecuted: 0,
            windowStart: Date.now()
        });
    }

    canExecute(action) {
        let limit = this.limits.get(action);
        if (!limit) {
            this.setLimit(action);
            limit = this.limits.get(action);
        }

        const now = Date.now();
        
        // Reinicia a janela de tempo se necessário
        if (now - limit.windowStart >= this.windowSize) {
            limit.windowStart = now;
            this.actionCounts.set(action, 0);
        }

        // Verifica o número de requisições na janela
        const currentCount = this.actionCounts.get(action) || 0;
        if (currentCount >= limit.maxRequests) {
            return false;
        }

        // Verifica o cooldown
        if (now - limit.lastExecuted < limit.cooldown) {
            return false;
        }

        // Atualiza contadores
        limit.lastExecuted = now;
        this.actionCounts.set(action, currentCount + 1);
        return true;
    }

    getTimeUntilNext(action) {
        const limit = this.limits.get(action);
        if (!limit) return 0;

        const now = Date.now();
        return Math.max(0, limit.cooldown - (now - limit.lastExecuted));
    }

    resetLimit(action) {
        this.limits.delete(action);
        this.actionCounts.delete(action);
    }
}
