
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

    hideAllPanels() {
        this.panels.forEach(panel => {
            if (panel.hide) {
                panel.hide();
            }
        });
    }
}
