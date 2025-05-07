
export default class GameState {
    constructor() {
        this.state = {
            buildings: {},
            npcs: {},
            camera: {
                zoom: 1.5,
                position: { x: 0, y: 0 }
            }
        };
    }

    saveState() {
        localStorage.setItem('gameState', JSON.stringify(this.state));
    }

    loadState() {
        const saved = localStorage.getItem('gameState');
        if (saved) {
            this.state = JSON.parse(saved);
        }
        return this.state;
    }
}
