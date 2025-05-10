
export default class BackupService {
    constructor(scene) {
        this.scene = scene;
        this.backupInterval = 5 * 60 * 1000; // 5 minutos
        this.maxBackups = 5;
        this.backupPrefix = 'game_backup_';
        this.setupAutoBackup();
    }

    setupAutoBackup() {
        setInterval(() => this.createBackup(), this.backupInterval);
    }

    async createBackup() {
        try {
            const gameState = this.getGameState();
            const timestamp = Date.now();
            const backupKey = `${this.backupPrefix}${timestamp}`;
            
            // Salvar backup
            localStorage.setItem(backupKey, JSON.stringify(gameState));
            
            // Gerenciar backups antigos
            this.cleanOldBackups();
            
            console.log(`Backup created: ${backupKey}`);
            return true;
        } catch (error) {
            console.error('Backup failed:', error);
            return false;
        }
    }

    getGameState() {
        const { grid, farmer } = this.scene;
        return {
            version: '1.0',
            timestamp: Date.now(),
            grid: this.serializeGrid(grid),
            farmer: this.serializeEntity(farmer),
            resources: this.scene.resources,
            buildings: this.serializeBuildings()
        };
    }

    serializeGrid(grid) {
        if (!grid) return null;
        return {
            width: grid.width,
            height: grid.height,
            buildings: Object.fromEntries(
                Object.entries(grid.buildingGrid).map(([key, value]) => [
                    key,
                    {
                        type: value.type,
                        buildingType: value.buildingType,
                        gridX: value.gridX,
                        gridY: value.gridY
                    }
                ])
            )
        };
    }

    serializeEntity(entity) {
        if (!entity) return null;
        return {
            gridX: entity.gridX,
            gridY: entity.gridY,
            type: entity.type
        };
    }

    serializeBuildings() {
        const buildings = {};
        this.scene.grid.buildingGrid.forEach((building, key) => {
            buildings[key] = {
                type: building.type,
                gridX: building.gridX,
                gridY: building.gridY,
                state: building.state
            };
        });
        return buildings;
    }

    cleanOldBackups() {
        const backups = this.getBackupsList();
        if (backups.length > this.maxBackups) {
            backups
                .slice(this.maxBackups)
                .forEach(key => localStorage.removeItem(key));
        }
    }

    getBackupsList() {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.backupPrefix))
            .sort()
            .reverse();
    }

    async restoreFromBackup(backupKey) {
        try {
            const backup = localStorage.getItem(backupKey);
            if (!backup) return false;

            const state = JSON.parse(backup);
            await this.scene.loadGameState(state);
            return true;
        } catch (error) {
            console.error('Restore failed:', error);
            return false;
        }
    }
}
