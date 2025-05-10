
export default class InputValidationService {
    constructor() {
        this.lastActionTimestamp = {};
        this.actionLimits = {
            movement: 100,
            building: 500,
            shop: 1000,
            resource: 300
        };
    }

    validateInput(input, type) {
        if (!input) return false;
        
        switch(type) {
            case 'position':
                return Number.isInteger(input.x) && Number.isInteger(input.y);
            case 'resource':
                return Number.isInteger(input.amount) && input.amount > 0;
            case 'building':
                return typeof input.type === 'string' && input.type.length > 0;
            default:
                return false;
        }
    }

    validateAction(actionType, entityId) {
        const key = `${actionType}_${entityId}`;
        const now = Date.now();
        const lastAction = this.lastActionTimestamp[key] || 0;
        const limit = this.actionLimits[actionType];

        if (now - lastAction < limit) {
            return {
                valid: false,
                cooldown: limit - (now - lastAction),
                reason: `Aguarde ${((limit - (now - lastAction)) / 1000).toFixed(1)}s`
            };
        }

        this.lastActionTimestamp[key] = now;
        return { valid: true };
    }

    validateBuildingPlacement(gridX, gridY, buildingType, resources) {
        const validation = this.validateAction('building', 'player');
        if (!validation.valid) {
            return validation;
        }

        if (!this.validateInput({ x: gridX, y: gridY }, 'position')) {
            return { valid: false, reason: 'Posição inválida' };
        }

        if (!this.validateInput({ type: buildingType }, 'building')) {
            return { valid: false, reason: 'Tipo de construção inválido' };
        }

        return { valid: true };
    }

    resetValidation(actionType, entityId) {
        const key = `${actionType}_${entityId}`;
        delete this.lastActionTimestamp[key];
    }
}
