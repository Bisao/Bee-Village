
export default class UIController {
    constructor(scene) {
        this.scene = scene;
        this.uiElements = new Map();
    }

    init() {
        this.setupUIHandlers();
        this.createSidePanel();
        this.createBuildingButtons();
        this.createResourcePanel();
        this.setupResizeHandlers();
    }

    setupUIHandlers() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.scene.selectedBuilding = btn.dataset.building;
                if (this.scene.previewBuilding) {
                    this.scene.previewBuilding.destroy();
                    this.scene.previewBuilding = null;
                }
                document.getElementById('side-panel').style.display = 'none';
            });
        });

        const toggleButton = document.getElementById('toggleStructures');
        const sidePanel = document.getElementById('side-panel');

        if (toggleButton && sidePanel) {
            toggleButton.addEventListener('click', () => {
                const isVisible = sidePanel.style.display === 'flex';
                sidePanel.style.display = isVisible ? 'none' : 'flex';
                if (!isVisible) {
                    this.clearBuildingSelection();
                }
            });
        }
    }

    clearBuildingSelection() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(b => b.classList.remove('selected'));
        this.scene.selectedBuilding = null;
        if (this.scene.previewBuilding) {
            this.scene.previewBuilding.destroy();
            this.scene.previewBuilding = null;
        }
    }

    showFeedback(message, success = true) {
        const text = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            message,
            { 
                fontSize: '16px',
                fill: success ? '#4CAF50' : '#f44336',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 20,
            duration: 5000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    showSiloModal(resources) {
        const existingModal = document.querySelector('.silo-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'silo-modal';
        modal.innerHTML = `
            <div class="silo-content">
                <div class="silo-header">
                    <h2 class="silo-title">🏗️ Armazém de Recursos</h2>
                    <button class="close-button">✕</button>
                </div>
                <div class="resources-grid">
                    <div class="resource-category">
                        <h3>🪓 Recursos de Madeira</h3>
                        <div class="resource-item">
                            <div class="resource-icon">🌳</div>
                            <div class="resource-info">
                                <div class="resource-name">Toras de Madeira</div>
                                <div class="resource-amount">${resources.find(r => r.name === 'Madeira')?.amount || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.find(r => r.name === 'Madeira')?.amount || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="resource-category">
                        <h3>⛏️ Recursos Minerais</h3>
                        <div class="resource-item">
                            <div class="resource-icon">⛏️</div>
                            <div class="resource-info">
                                <div class="resource-name">Minério</div>
                                <div class="resource-amount">${resources.find(r => r.name === 'Minério')?.amount || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.find(r => r.name === 'Minério')?.amount || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => modal.remove();
    }
}
