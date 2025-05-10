
import BackupService from './BackupService.js';
import ErrorRecoveryService from './ErrorRecoveryService.js';
import InputValidationService from './InputValidationService.js';
import MemoryManager from './MemoryManager.js';
import PerformanceService from './PerformanceService.js';
import RateLimitService from './RateLimitService.js';

export default class ServiceManager {
    constructor(scene) {
        this.scene = scene;
        this.services = new Map();
        this.initializeServices();
    }

    initializeServices() {
        this.services.set('backup', new BackupService(this.scene));
        this.services.set('error', new ErrorRecoveryService(this.scene));
        this.services.set('validation', new InputValidationService(this.scene));
        this.services.set('memory', new MemoryManager(this.scene));
        this.services.set('performance', new PerformanceService(this.scene));
        this.services.set('rateLimit', new RateLimitService(this.scene));
    }

    getService(name) {
        return this.services.get(name);
    }

    shutdown() {
        this.services.forEach(service => {
            if (service.shutdown) {
                service.shutdown();
            }
        });
    }
}
