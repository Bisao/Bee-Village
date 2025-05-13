export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    async create() {
        if (!this.textures.exists('tile_grass')) {
            return;
        }

        // Initialize managers
        this.initManager = new InitializationManager(this);
        this.updateManager = new UpdateManager(this);

        // Initialize all systems through InitializationManager
        this.managers = this.initManager.initializeManagers();

        // Register managers that need updates
        this.managers.forEach(manager => {
            this.updateManager.registerManager(manager);
        });

        // Setup autosave
        this.time.addEvent({
            delay: 60000,
            callback: () => this.managers.get('save').autoSave(),
            loop: true
        });
    }

    update() {
        // Delegate updates to UpdateManager
        this.updateManager.update();
    }
}