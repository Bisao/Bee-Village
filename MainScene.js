export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    async create() {
        if (!this.textures.exists('tile_grass')) {
            return;
        }

        // Initialize core managers
        this.initManager = new InitializationManager(this);
        this.updateManager = new UpdateManager(this);
        
        // Initialize all managers
        this.managers = this.initManager.initializeManagers();
        
        // Get core managers
        this.stateManager = this.managers.get('state');
        this.eventManager = this.managers.get('event');
        
        // Register managers for updates
        this.managers.forEach(manager => {
            if (manager.update) {
                this.updateManager.registerManager(manager);
            }
        });

        // Configure autosave
        this.configureAutosave();
        
        // Emit scene ready event
        this.eventManager.emit('sceneReady');
    }

    configureAutosave() {
        this.time.addEvent({
            delay: 60000,
            callback: () => this.managers.get('save').autoSave(),
            loop: true
        });
    }

    update() {
        if (this.stateManager.getState('paused')) return;
        this.updateManager.update();
    }
}