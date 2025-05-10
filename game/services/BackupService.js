
export default class BackupService {
    constructor() {
        this.MAX_BACKUPS = 5;
        this.BACKUP_PREFIX = 'game_backup_';
    }

    createBackup(gameState) {
        try {
            const timestamp = Date.now();
            const backupKey = `${this.BACKUP_PREFIX}${timestamp}`;
            
            // Salva novo backup
            localStorage.setItem(backupKey, JSON.stringify({
                timestamp,
                state: gameState
            }));

            // Gerencia backups antigos
            this.manageBackups();
            
            return true;
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            return false;
        }
    }

    manageBackups() {
        const backups = this.getAllBackups();
        while (backups.length > this.MAX_BACKUPS) {
            const oldestBackup = backups.shift();
            localStorage.removeItem(oldestBackup.key);
        }
    }

    getAllBackups() {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.BACKUP_PREFIX))
            .map(key => ({
                key,
                timestamp: parseInt(key.replace(this.BACKUP_PREFIX, ''))
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    restoreBackup(timestamp) {
        const backupKey = `${this.BACKUP_PREFIX}${timestamp}`;
        const backup = localStorage.getItem(backupKey);
        
        if (backup) {
            return JSON.parse(backup).state;
        }
        return null;
    }
}
