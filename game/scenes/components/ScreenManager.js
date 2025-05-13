The code adds camera initialization logic to the ScreenManager class.
```

```javascript
export default class ScreenManager {
    constructor(scene) {
        this.scene = scene;
        this.browser = this.detectBrowser();
        this.dimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.uiElements = new Map();

        // Atualiza as dimensões quando a tela é redimensionada
        window.addEventListener('resize', () => {
            this.dimensions = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            this.adjustAllElements();
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

    initializeCamera() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const initialZoom = isMobile ? 0.8 : 1.5;
        this.scene.cameras.main.setZoom(initialZoom);
    }

    registerElement(key, element, config) {
        this.uiElements.set(key, { element, config });
        this.adjustElement(key);
    }

    adjustElement(key) {
        const item = this.uiElements.get(key);
        if (!item) return;

        const { element, config } = item;
        const isMobile = this.dimensions.width <= 768;
        const isTablet = this.dimensions.width <= 1024 && this.dimensions.width > 768;

        // Ajusta escala
        if (config.scale) {
            const baseScale = config.scale.base || 1;
            const mobileScale = config.scale.mobile || baseScale * 0.8;
            const tabletScale = config.scale.tablet || baseScale * 0.9;

            element.setScale(isMobile ? mobileScale : isTablet ? tabletScale : baseScale);
        }

        // Ajusta posição
        if (config.position) {
            const x = this.calculatePosition(config.position.x, this.dimensions.width);
            const y = this.calculatePosition(config.position.y, this.dimensions.height);
            element.setPosition(x, y);
        }

        // Ajusta dimensões
        if (config.dimensions) {
            const width = this.calculateDimension(config.dimensions.width, this.dimensions.width);
            const height = this.calculateDimension(config.dimensions.height, this.dimensions.height);
            if (element.setSize) {
                element.setSize(width, height);
            }
        }

        // Ajusta profundidade
        if (config.depth !== undefined) {
            element.setDepth(config.depth);
        }

        // Ajusta visibilidade
        if (config.visibility) {
            element.setVisible(this.evaluateVisibilityCondition(config.visibility));
        }
    }

    calculatePosition(pos, containerSize) {
        if (typeof pos === 'number') return pos;
        if (typeof pos === 'string') {
            if (pos.endsWith('%')) {
                return (parseFloat(pos) / 100) * containerSize;
            }
            if (pos === 'center') {
                return containerSize / 2;
            }
        }
        return 0;
    }

    calculateDimension(dim, containerSize) {
        if (typeof dim === 'number') return dim;
        if (typeof dim === 'string' && dim.endsWith('%')) {
            return (parseFloat(dim) / 100) * containerSize;
        }
        return containerSize;
    }

    evaluateVisibilityCondition(condition) {
        if (typeof condition === 'boolean') return condition;
        if (typeof condition === 'function') {
            return condition(this.dimensions);
        }
        return true;
    }

    adjustAllElements() {
        for (const key of this.uiElements.keys()) {
            this.adjustElement(key);
        }
    }

    getDeviceInfo() {
        return {
            browser: this.browser,
            dimensions: this.dimensions,
            isMobile: this.dimensions.width <= 768,
            isTablet: this.dimensions.width <= 1024 && this.dimensions.width > 768,
            isDesktop: this.dimensions.width > 1024,
            pixelRatio: window.devicePixelRatio || 1
        };
    }
}
```The code adds camera initialization logic to the ScreenManager class.