
export default class ErrorRecoveryService {
    constructor(scene) {
        this.scene = scene;
        this.errorStack = [];
        this.MAX_ERRORS = 50;
        this.backupInterval = 5 * 60 * 1000; // 5 minutos
        
        this.setupErrorHandling();
        this.startAutoBackup();
    }

    setupErrorHandling() {
        window.onerror = (msg, url, line, col, error) => {
            this.handleError(error);
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
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
            const gameState = this.getLastValidState();
            if (gameState) {
                this.scene.loadGameState(gameState);
                errorInfo.recovered = true;
                console.log('Estado do jogo recuperado com sucesso');
                return true;
            }
        } catch (e) {
            console.error('Falha na recuperação:', e);
        }
        return false;
    }

    getLastValidState() {
        const backups = JSON.parse(localStorage.getItem('gameStateBackups') || '[]');
        for (const backupKey of backups) {
            try {
                const backup = localStorage.getItem(backupKey);
                if (backup) {
                    const state = JSON.parse(backup);
                    if (this.validateGameState(state)) {
                        return state;
                    }
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    }

    validateGameState(state) {
        return state && 
               state.version && 
               state.timestamp && 
               state.grid &&
               state.resources;
    }

    saveErrorLog() {
        localStorage.setItem('errorLog', JSON.stringify(this.errorStack));
    }

    startAutoBackup() {
        setInterval(() => {
            if (this.scene.autoSave) {
                this.scene.autoSave();
            }
        }, this.backupInterval);
    }
}
