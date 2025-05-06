
export default class ResourceManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.costs = {
            farmerHouse: { coins: 1000, wood: 50, stone: 30 },
            cowHouse: { coins: 800, wood: 40, stone: 20 },
            chickenHouse: { coins: 500, wood: 30, stone: 15 },
            pigHouse: { coins: 600, wood: 35, stone: 18 },
            minerHouse: { coins: 1200, wood: 60, stone: 45 },
            fishermanHouse: { coins: 900, wood: 45, stone: 25 }
        };
    }

    canAfford(buildingType) {
        const cost = this.costs[buildingType];
        const resources = this.stateManager.getState().resources;
        
        return cost && 
               resources.coins >= cost.coins &&
               resources.wood >= cost.wood &&
               resources.stone >= cost.stone;
    }

    deductCost(buildingType) {
        const cost = this.costs[buildingType];
        if (cost) {
            const currentState = this.stateManager.getState();
            this.stateManager.setState({
                resources: {
                    coins: currentState.resources.coins - cost.coins,
                    wood: currentState.resources.wood - cost.wood,
                    stone: currentState.resources.stone - cost.stone
                }
            });
        }
    }

    addResources(type, amount) {
        const currentState = this.stateManager.getState();
        this.stateManager.setState({
            resources: {
                ...currentState.resources,
                [type]: currentState.resources[type] + amount
            }
        });
    }
}
