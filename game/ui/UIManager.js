
import MobileControls from './mobile/MobileControls.js';

export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            this.mobileControls = new MobileControls(scene);
        }
    }

    init() {
        if (this.isMobile) {
            this.mobileControls.init();
        }
        this.setupCommonUI();
    }

    setupCommonUI() {
        // Configurar elementos comuns da UI
        const sidePanel = document.getElementById('side-panel');
        const toggleButton = document.getElementById('toggleStructures');

        if (toggleButton && sidePanel) {
            toggleButton.addEventListener('click', () => {
                const isVisible = sidePanel.style.display === 'flex';
                sidePanel.style.display = isVisible ? 'none' : 'flex';
            });
        }
    }

    showMobileControls() {
        if (this.isMobile && this.mobileControls) {
            this.mobileControls.show();
        }
    }

    hideMobileControls() {
        if (this.isMobile && this.mobileControls) {
            this.mobileControls.hide();
        }
    }
}
