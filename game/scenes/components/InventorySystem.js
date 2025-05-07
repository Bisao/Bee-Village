
export default class InventorySystem {
    constructor(scene) {
        this.scene = scene;
        this.inventories = new Map();
        this.maxCapacity = 10;
    }

    createInventory(ownerId) {
        if (!this.inventories.has(ownerId)) {
            this.inventories.set(ownerId, {
                items: [],
                capacity: this.maxCapacity,
                tools: new Map()
            });
        }
    }

    addItem(ownerId, item) {
        const inventory = this.inventories.get(ownerId);
        if (inventory && inventory.items.length < inventory.capacity) {
            inventory.items.push(item);
            return true;
        }
        return false;
    }

    addTool(ownerId, tool) {
        const inventory = this.inventories.get(ownerId);
        if (inventory) {
            inventory.tools.set(tool.name, {
                durability: 100,
                ...tool
            });
            return true;
        }
        return false;
    }

    getInventory(ownerId) {
        return this.inventories.get(ownerId);
    }

    useTool(ownerId, toolName) {
        const inventory = this.inventories.get(ownerId);
        if (inventory && inventory.tools.has(toolName)) {
            const tool = inventory.tools.get(toolName);
            tool.durability -= 5;
            if (tool.durability <= 0) {
                inventory.tools.delete(toolName);
                return false;
            }
            return true;
        }
        return false;
    }
}
