
export default class SiloPanel {
    constructor(scene) {
        this.scene = scene;
    }

    show(resources) {
        this.cleanupExistingModals();
        const modal = this.createModal(resources);
        document.body.appendChild(modal);
        this.setupEventListeners(modal);
    }

    cleanupExistingModals() {
        const existingModals = document.querySelectorAll('.silo-modal');
        existingModals.forEach(modal => modal.remove());
    }

    createModal(resources) {
        const modal = document.createElement('div');
        modal.className = 'silo-modal';
        modal.innerHTML = this.getModalHTML(resources);
        return modal;
    }

    getModalHTML(resources) {
        return `
            <div class="silo-content">
                <div class="silo-header">
                    <h2 class="silo-title">🏗️ Armazém de Recursos</h2>
                    <button class="close-button">✕</button>
                </div>
                <div class="resources-grid">
                    ${this.getResourceCategoryHTML('🪓 Recursos de Madeira', 'Madeira', '🌳', resources)}
                    ${this.getResourceCategoryHTML('🌾 Recursos Agrícolas', 'Trigo', '🌾', resources)}
                    ${this.getResourceCategoryHTML('⛏️ Recursos Minerais', 'Minério', '⛏️', resources)}
                </div>
            </div>
        `;
    }

    getResourceCategoryHTML(title, resourceName, icon, resources) {
        const resource = resources.find(r => r.name === resourceName);
        const amount = resource?.amount || 0;
        const percentage = (amount / 100) * 100;

        return `
            <div class="resource-category">
                <h3>${title}</h3>
                <div class="resource-item">
                    <div class="resource-icon">${icon}</div>
                    <div class="resource-info">
                        <div class="resource-name">${resourceName}</div>
                        <div class="resource-amount">${amount}</div>
                    </div>
                    <div class="resource-progress">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners(modal) {
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => modal.remove();
    }
}
