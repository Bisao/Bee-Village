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

    setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = name + '=' + encodeURIComponent(value) + 
            '; expires=' + expires + 
            '; path=/' +
            '; SameSite=Strict' +
            '; Secure';
    }
}