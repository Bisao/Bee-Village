export default class UIManager {
    constructor(scene) {
        this.scene = scene;
    }

    setupUIHandlers() {
        this.setupBuildButtons();
        this.setupSaveButtons();
    }

    setupBuildButtons() {
        const buildButtons = document.querySelectorAll('.build-button');
        buildButtons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.dataset.building;
                this.scene.buildingManager.startBuildingPlacement(buildingType);
            });
        });
    }

    setupSaveButtons() {
        const saveButton = document.querySelector('.save-button');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.scene.saveManager.autoSave();
            });
        }

        const clearSaveButton = document.querySelector('.clear-save-button');
        if (clearSaveButton) {
            clearSaveButton.addEventListener('click', () => {
                localStorage.removeItem('gameState');
                console.log('Save cleared');
            });
        }
    }

    showFeedback(text, isGood) {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback');
        feedbackElement.textContent = text;
        feedbackElement.classList.add(isGood ? 'good' : 'bad');
        document.body.appendChild(feedbackElement);
        setTimeout(() => feedbackElement.remove(), 3000);
    }

    showSiloModal(resources) {
        const existingModal = document.querySelector('.silo-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'silo-modal';
        modal.innerHTML = this.createSiloModalContent(resources);
        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => modal.remove();
    }

    createSiloModalContent(resources) {
        return `
            <div class="silo-content">
                <div class="silo-header">
                    <h2 class="silo-title">🏗️ Armazém de Recursos</h2>
                    <button class="close-button">✕</button>
                </div>
                ${this.createResourceCategories(resources)}
            </div>
        `;
    }

    createResourceCategories(resources) {
        const categories = [
            {
                icon: '🪓',
                title: 'Recursos de Madeira',
                resource: 'Madeira',
                resourceIcon: '🌳'
            },
            {
                icon: '🌾',
                title: 'Recursos Agrícolas',
                resource: 'Trigo',
                resourceIcon: '🌾'
            },
            {
                icon: '⛏️',
                title: 'Recursos Minerais',
                resource: 'Minério',
                resourceIcon: '⛏️'
            }
        ];

        return `
            <div class="resources-grid">
                ${categories.map(category => this.createResourceCategory(category, resources)).join('')}
            </div>
        `;
    }

    createResourceCategory(category, resources) {
        const amount = resources.find(r => r.name === category.resource)?.amount || 0;
        const progress = (amount / 100) * 100;

        return `
            <div class="resource-category">
                <h3>${category.icon} ${category.title}</h3>
                <div class="resource-item">
                    <div class="resource-icon">${category.resourceIcon}</div>
                    <div class="resource-info">
                        <div class="resource-name">${category.resource}</div>
                        <div class="resource-amount">${amount}</div>
                    </div>
                    <div class="resource-progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
}