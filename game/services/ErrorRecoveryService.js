
export default class ErrorRecoveryService {
    constructor() {
        this.errorStack = [];
        this.MAX_ERRORS = 50;
        
        window.onerror = (msg, url, line, col, error) => {
            this.handleError(error);
        };
    }

    handleError(error) {
        const errorInfo = {
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            recovered: false
        };

        this.errorStack.push(errorInfo);
        if (this.errorStack.length > this.MAX_ERRORS) {
            this.errorStack.shift();
        }

        this.attemptRecovery(errorInfo);
        this.saveErrorLog();
    }

    attemptRecovery(errorInfo) {
        try {
            // Tenta recuperar o estado do jogo
            const gameState = localStorage.getItem('gameState');
            if (gameState) {
                errorInfo.recovered = true;
                return JSON.parse(gameState);
            }
        } catch (e) {
            console.error('Falha na recuperação:', e);
        }
        return null;
    }

    saveErrorLog() {
        localStorage.setItem('errorLog', JSON.stringify(this.errorStack));
    }
}
