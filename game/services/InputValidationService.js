
export default class InputValidationService {
    constructor() {
        this.lastActionTimestamp = {};
        this.actionLimits = {
            movement: 100, // ms entre movimentos
            building: 500, // ms entre construções
            shop: 1000 // ms entre interações com loja
        };
    }

    validateGridPosition(x, y, gridWidth, gridHeight) {
        return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
    }

    validateAction(actionType, entityId) {
        const key = `${actionType}_${entityId}`;
        const now = Date.now();
        const lastAction = this.lastActionTimestamp[key] || 0;
        const limit = this.actionLimits[actionType];

        if (now - lastAction < limit) {
            return false;
        }

        this.lastActionTimestamp[key] = now;
        return true;
    }

    validateBuildingPlacement(gridX, gridY, buildingType, resources) {
        if (!this.validateAction('building', 'player')) {
            return { valid: false, reason: 'Aguarde para construir novamente' };
        }

        // Adicione suas validações específicas de construção aqui
        return { valid: true };
    }

    validateMovement(entity, newX, newY, grid) {
        if (!this.validateAction('movement', entity.id)) {
            return { valid: false, reason: 'Movimento muito rápido' };
        }

        if (!this.validateGridPosition(newX, newY, grid.width, grid.height)) {
            return { valid: false, reason: 'Posição inválida' };
        }

        return { valid: true };
    }

    validateShopInteraction(player, item) {
        if (!this.validateAction('shop', player.id)) {
            return { valid: false, reason: 'Aguarde para interagir com a loja' };
        }

        return { valid: true };
    }
}
