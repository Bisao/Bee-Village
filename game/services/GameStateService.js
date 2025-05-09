
export default class GameStateService {
    constructor() {
        this.state = {
            resources: {},
            buildings: {},
            characters: {}
        };
    }

    saveState() {
        localStorage.setItem('gameState', JSON.stringify(this.state));
    }

    loadState() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            this.state = JSON.parse(savedState);
        }
    }
}
