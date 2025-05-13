export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.setupUIHandlers();
    }

    setupUIHandlers() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.scene.buildingManager.selectedBuilding = btn.dataset.building;
                if (this.scene.buildingManager.previewBuilding) {
                    this.scene.buildingManager.previewBuilding.destroy();
                    this.scene.buildingManager.previewBuilding = null;
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
                    this.scene.buildingManager.clearBuildingSelection();
                }
            });
        }
        this.panels = new Map();
        this.initializePanels();
    }

    async initializePanels() {
        const { default: NPCControlPanel } = await import('./NPCControlPanel.js');
        const { default: SiloPanel } = await import('./SiloPanel.js');
        const { default: SettingsPanel } = await import('./SettingsPanel.js');
        const { default: DesktopUI } = await import('./DesktopUI.js');
        const { default: MobileUI } = await import('./MobileUI.js');

        this.panels.set('npcControl', new NPCControlPanel(this.scene));
        this.panels.set('silo', new SiloPanel(this.scene));
        this.panels.set('settings', new SettingsPanel(this.scene));

        // Initialize UI based on device
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.ui = new MobileUI(this.scene);
        } else {
            this.ui = new DesktopUI(this.scene);
        }

        this.ui.createUI();
    }

    showSiloModal(resources) {
        const panel = this.panels.get('silo');
        if (panel) {
            panel.show(resources);
        }
    }

    showSettingsPanel() {
        const panel = this.panels.get('settings');
        if (panel) {
            panel.show();
        }
    }

    cleanupExistingModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    }

    showPanel(panelName, data) {
        const panel = this.panels.get(panelName);
        if (panel) {
            panel.show(data);
        }
    }

    hidePanel(panelName) {
        const panel = this.panels.get(panelName);
        if (panel && panel.hide) {
            panel.hide();
        }
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
                    ${this.createResourceCategories(resources)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEvents(modal);
    }

    showNPCControls(npc) {
        this.cleanupExistingModals();
        const modal = this.createNPCModal(npc);
        document.body.appendChild(modal);
        this.setupNPCModalEvents(modal, npc);
    }

    showSettingsPanel() {
        const panel = this.panels.get('settings');
        if (panel) {
            panel.show();
        }
    }

    private createResourceCategories(resources) {
        // Implementation of resource categories creation
        return `
            <div class="resource-category">
                <h3>🪓 Recursos de Madeira</h3>
                ${this.createResourceItem('Madeira', '🌳', resources)}
            </div>
            <div class="resource-category">
                <h3>🌾 Recursos Agrícolas</h3>
                ${this.createResourceItem('Trigo', '🌾', resources)}
            </div>
            <div class="resource-category">
                <h3>⛏️ Recursos Minerais</h3>
                ${this.createResourceItem('Minério', '⛏️', resources)}
            </div>
        `;
    }
}
export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.panels = new Map();
        this.initializePanels();
    }

    async initializePanels() {
        const { default: NPCControlPanel } = await import('./NPCControlPanel.js');
        const { default: SiloPanel } = await import('./SiloPanel.js');
        const { default: SettingsPanel } = await import('./SettingsPanel.js');

        this.panels.set('npcControl', new NPCControlPanel(this.scene));
        this.panels.set('silo', new SiloPanel(this.scene));
        this.panels.set('settings', new SettingsPanel(this.scene));
    }

    showSiloModal(resources) {
        const panel = this.panels.get('silo');
        if (panel) {
            panel.show(resources);
        }
    }

    setupUIHandlers() {
        const buttons = document.querySelectorAll('.building-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.getAttribute('data-building');
                this.scene.buildingManager.selectBuilding(buildingType);
            });
        });
    }

    showFeedback(message, isSuccess) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = `feedback ${isSuccess ? 'success' : 'error'}`;
        feedbackEl.textContent = message;
        document.body.appendChild(feedbackEl);

        setTimeout(() => feedbackEl.remove(), 3000);
    }

    showPanel(panelName, data) {
        const panel = this.panels.get(panelName);
        if (panel) {
            panel.show(data);
        }
    }

    hidePanel(panelName) {
        const panel = this.panels.get(panelName);
        if (panel && panel.hide) {
            panel.hide();
        }
    }
}