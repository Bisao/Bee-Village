
export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.initializeUI();
    }

    initializeUI() {
        this.setupUIHandlers();
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
                this.scene.startBuildingPlacement(buildingType);
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
                <div class="resources-grid">
                    ${this.createResourceCategories(resources)}
                </div>
            </div>
        `;
    }

    createResourceCategories(resources) {
        const categories = [
            {
                icon: '🪓',
                title: 'Recursos de Madeira',
                resourceName: 'Madeira',
                resourceIcon: '🌳'
            },
            {
                icon: '🌾',
                title: 'Recursos Agrícolas',
                resourceName: 'Trigo',
                resourceIcon: '🌾'
            },
            {
                icon: '⛏️',
                title: 'Recursos Minerais',
                resourceName: 'Minério',
                resourceIcon: '⛏️'
            }
        ];

        return categories.map(category => {
            const amount = resources.find(r => r.name === category.resourceName)?.amount || 0;
            const progress = (amount / 100) * 100;

            return `
                <div class="resource-category">
                    <h3>${category.icon} ${category.title}</h3>
                    <div class="resource-item">
                        <div class="resource-icon">${category.resourceIcon}</div>
                        <div class="resource-info">
                            <div class="resource-name">${category.resourceName}</div>
                            <div class="resource-amount">${amount}</div>
                        </div>
                        <div class="resource-progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showFeedback(text, isGood) {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback');
        feedbackElement.textContent = text;
        feedbackElement.classList.add(isGood ? 'good' : 'bad');
        document.body.appendChild(feedbackElement);
        setTimeout(() => feedbackElement.remove(), 3000);
    }
}
