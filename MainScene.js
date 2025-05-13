export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.selectedBuilding = null;
        this.resourceSystem = null;
    }

    async create() {
        if (!this.textures.exists('tile_grass')) {
            return;
        }

        // Initialize managers
        this.assetManager = new AssetManager(this);
        this.buildingManager = new BuildingManager(this);
        this.uiManager = new UIManager(this);
        this.npcManager = new NPCManager(this);
        this.saveManager = new SaveManager(this);
        this.movementManager = new MovementManager(this);
        this.animationManager = new AnimationManager(this);
        this.feedbackManager = new FeedbackManager(this);
        this.gridManager = new GridManager(this);
        this.inputManager = new InputManager(this);
        this.professionManager = new ProfessionManager(this);
        this.inventoryManager = new InventoryManager(this);

        // Load initial assets
        await this.assetManager.loadAssets();

        // Setup autosave
        this.time.addEvent({
            delay: 60000,
            callback: () => this.saveManager.autoSave(),
            loop: true
        });

        // Setup input handlers
        this.inputManager.init();

        // Initialize UI
        await this.uiManager.initializePanels();
    }

    update() {
        // Core update logic
        this.managers.forEach(manager => {
            if (manager.update) {
                manager.update();
            }
        });
    }
}