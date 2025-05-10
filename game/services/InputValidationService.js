
export default class InputValidationService {
    static validateGridPosition(x, y, gridWidth, gridHeight) {
        return {
            isValid: x >= 0 && x < gridWidth && y >= 0 && y < gridHeight,
            message: 'Posição inválida no grid'
        };
    }

    static validateBuildingPlacement(building, position, resources) {
        const validations = {
            isValid: true,
            messages: []
        };

        if (!building) {
            validations.isValid = false;
            validations.messages.push('Construção inválida');
        }

        if (!resources || resources < building?.cost) {
            validations.isValid = false;
            validations.messages.push('Recursos insuficientes');
        }

        return validations;
    }

    static rateLimiter = new Map();

    static checkRateLimit(actionType, cooldown = 1000) {
        const now = Date.now();
        const lastAction = this.rateLimiter.get(actionType);
        
        if (lastAction && now - lastAction < cooldown) {
            return false;
        }
        
        this.rateLimiter.set(actionType, now);
        return true;
    }
}
