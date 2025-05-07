
export default class ScreenManager {
    constructor(scene) {
        this.scene = scene;
        this.browser = this.detectBrowser();
        this.dimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Atualiza as dimensões quando a tela é redimensionada
        window.addEventListener('resize', () => {
            this.dimensions = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            this.adjustUI();
        });
    }

    detectBrowser() {
        const userAgent = navigator.userAgent;
        let browser = "unknown";

        if (userAgent.match(/chrome|chromium|crios/i)) {
            browser = "chrome";
        } else if (userAgent.match(/firefox|fxios/i)) {
            browser = "firefox";
        } else if (userAgent.match(/safari/i)) {
            browser = "safari";
        } else if (userAgent.match(/opr\//i)) {
            browser = "opera";
        } else if (userAgent.match(/edg/i)) {
            browser = "edge";
        }

        return browser;
    }

    adjustUI() {
        const isMobile = this.dimensions.width <= 768;
        const isTablet = this.dimensions.width <= 1024 && this.dimensions.width > 768;
        
        // Ajusta o zoom da câmera baseado no dispositivo
        const zoom = isMobile ? 0.8 : isTablet ? 1.2 : 1.5;
        this.scene.cameras.main.setZoom(zoom);

        // Ajusta a posição do painel lateral
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) {
            if (isMobile) {
                sidePanel.style.width = '90%';
                sidePanel.style.left = '5%';
                sidePanel.style.maxHeight = '60vh';
            } else {
                sidePanel.style.width = 'auto';
                sidePanel.style.left = '20px';
                sidePanel.style.maxHeight = '80vh';
            }
        }

        // Ajusta o painel de controles
        const controlsPanel = document.getElementById('controls-panel');
        if (controlsPanel) {
            if (isMobile) {
                controlsPanel.style.display = 'flex';
                controlsPanel.style.bottom = '10px';
                controlsPanel.style.left = '10px';
            } else {
                controlsPanel.style.display = 'none';
            }
        }

        // Notifica sobre possíveis problemas de compatibilidade
        if (this.browser === 'safari' && isMobile) {
            console.warn('Safari mobile pode ter algumas limitações de desempenho');
        }
    }

    getDeviceInfo() {
        return {
            browser: this.browser,
            dimensions: this.dimensions,
            isMobile: this.dimensions.width <= 768,
            isTablet: this.dimensions.width <= 1024 && this.dimensions.width > 768,
            isDesktop: this.dimensions.width > 1024
        };
    }
}
