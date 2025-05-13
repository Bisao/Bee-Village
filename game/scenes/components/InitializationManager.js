
export default class InitializationManager {
    constructor(scene) {
        this.scene = scene;
        this.managers = new Map();
    }

    initializeManagers() {
        // Core managers
        this.managers.set('state', new StateManager(this.scene));
        this.managers.set('event', new EventManager(this.scene));
        
        // Game managers
        this.managers.set('asset', new AssetManager(this.scene));
        this.managers.set('building', new BuildingManager(this.scene));
        this.managers.set('ui', new UIManager(this.scene));
        this.managers.set('npc', new NPCManager(this.scene));
        this.managers.set('save', new SaveManager(this.scene));
        this.managers.set('movement', new MovementManager(this.scene));
        this.managers.set('animation', new AnimationManager(this.scene));
        this.managers.set('feedback', new FeedbackManager(this.scene));
        this.managers.set('grid', new GridManager(this.scene));
        this.managers.set('input', new InputManager(this.scene));
        this.managers.set('profession', new ProfessionManager(this.scene));
        this.managers.set('inventory', new InventoryManager(this.scene));

        // Initialize all managers
        this.managers.forEach(manager => {
            if (manager.init) {
                manager.init();
            }
        });

        return this.managers;
    }

    getManager(name) {
        return this.managers.get(name);
    }
}
