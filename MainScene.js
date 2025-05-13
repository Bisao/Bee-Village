
import Grid from './scenes/components/Grid.js';

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
        
        // Initialize all managers through InitializationManager
        this.managers = this.initManager.initializeManagers();
        
        // Get core manager references
        this.stateManager = this.managers.get('state');
        this.eventManager = this.managers.get('event');
        
        // Register managers that need updates
        this.managers.forEach(manager => {
            if (manager.update) {
                this.updateManager.registerManager(manager);
            }
        });

        // Configure auto-save
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
