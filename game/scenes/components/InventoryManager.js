
export default class InventoryManager {
    constructor(scene) {
        this.scene = scene;
        this.inventories = new Map();
    }

    createInventory(id, config = {}) {
        const defaultConfig = {
            maxSlots: 20,
            stackSize: 99
        };

        const inventory = {
            items: new Map(),
            config: { ...defaultConfig, ...config }
        };

        this.inventories.set(id, inventory);
        return inventory;
    }

    addItem(inventoryId, item, quantity = 1) {
        const inventory = this.inventories.get(inventoryId);
        if (!inventory) return false;

        const existingItem = inventory.items.get(item.id);
        if (existingItem) {
            existingItem.quantity += quantity;
            return true;
        }

        if (inventory.items.size >= inventory.config.maxSlots) {
            return false;
        }

        inventory.items.set(item.id, { ...item, quantity });
        return true;
    }

    removeItem(inventoryId, itemId, quantity = 1) {
        const inventory = this.inventories.get(inventoryId);
        if (!inventory) return false;

        const item = inventory.items.get(itemId);
        if (!item || item.quantity < quantity) return false;

        item.quantity -= quantity;
        if (item.quantity <= 0) {
            inventory.items.delete(itemId);
        }
        return true;
    }

    getInventory(inventoryId) {
        return this.inventories.get(inventoryId);
    }
}
