
export class ErrorHandler {
    constructor() {
        this.errorStack = [];
        this.maxErrors = 50;
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
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
            handled: false
        };

        this.errorStack.push(errorInfo);
        this.trimErrorStack();
        this.logError(errorInfo);
        
        return this.attemptRecovery(errorInfo);
    }

    trimErrorStack() {
        if (this.errorStack.length > this.maxErrors) {
            this.errorStack = this.errorStack.slice(-this.maxErrors);
        }
    }

    logError(errorInfo) {
        console.error('Game Error:', {
            message: errorInfo.message,
            timestamp: new Date(errorInfo.timestamp).toISOString(),
            stack: errorInfo.stack
        });
    }

    attemptRecovery(errorInfo) {
        try {
            // Implementar lógica de recuperação específica
            errorInfo.handled = true;
            return true;
        } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
            return false;
        }
    }

    getErrorStack() {
        return [...this.errorStack];
    }

    clearErrorStack() {
        this.errorStack = [];
    }
}
