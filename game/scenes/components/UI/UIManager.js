
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
