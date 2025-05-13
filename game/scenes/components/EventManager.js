
export default class EventManager {
    constructor(scene) {
        this.scene = scene;
        this.events = new Phaser.Events.EventEmitter();
        this.setupEvents();
    }

    setupEvents() {
        // Game state events
        this.registerEvent('gameStateChanged');
        this.registerEvent('gamePaused');
        this.registerEvent('gameResumed');

        // Building events
        this.registerEvent('buildingPlaced');
        this.registerEvent('buildingRemoved');
        this.registerEvent('buildingSelected');

        // NPC events
        this.registerEvent('npcCreated');
        this.registerEvent('npcMoved');
        this.registerEvent('npcStateChanged');

        // Resource events
        this.registerEvent('resourceCollected');
        this.registerEvent('resourceStored');
        this.registerEvent('resourceDepleted');
    }

    registerEvent(eventName) {
        this[eventName] = (data) => this.events.emit(eventName, data);
    }

    on(eventName, callback) {
        this.events.on(eventName, callback);
    }

    off(eventName, callback) {
        this.events.off(eventName, callback);
    }

    emit(eventName, data) {
        this.events.emit(eventName, data);
    }
}
