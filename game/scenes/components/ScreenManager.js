
export default class ScreenManager {
    constructor(scene) {
        this.scene = scene;
        this.browser = this.detectBrowser();
        this.dimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.uiElements = new Map();
        this.scaleRatios = this.calculateScaleRatios();
        
        window.addEventListener('resize', () => {
            this.dimensions = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            this.scaleRatios = this.calculateScaleRatios();
            this.adjustAllElements();
        });
    }

    calculateScaleRatios() {
        const baseWidth = 1920;
        const baseHeight = 1080;
        return {
            width: this.dimensions.width / baseWidth,
            height: this.dimensions.height / baseHeight,
            uniform: Math.min(this.dimensions.width / baseWidth, this.dimensions.height / baseHeight)
        };
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

    registerElement(key, element, config) {
        this.uiElements.set(key, { 
            element, 
            config,
            originalSize: {
                width: element.width || element.displayWidth,
                height: element.height || element.displayHeight
            },
            originalPosition: {
                x: element.x,
                y: element.y
            }
        });
        this.adjustElement(key);
    }

    adjustElement(key) {
        const item = this.uiElements.get(key);
        if (!item) return;

        const { element, config, originalSize, originalPosition } = item;
        const isMobile = this.dimensions.width <= 768;
        const isTablet = this.dimensions.width <= 1024 && this.dimensions.width > 768;

        // Scale handling
        if (config.scale) {
            const baseScale = config.scale.base || 1;
            const mobileScale = config.scale.mobile || baseScale * 0.8;
            const tabletScale = config.scale.tablet || baseScale * 0.9;
            const deviceScale = isMobile ? mobileScale : isTablet ? tabletScale : baseScale;
            const finalScale = deviceScale * this.scaleRatios.uniform;
            
            if (element.setScale) {
                element.setScale(finalScale);
            }
        }

        // Position handling
        if (config.position) {
            const x = this.calculatePosition(config.position.x, this.dimensions.width, originalPosition.x);
            const y = this.calculatePosition(config.position.y, this.dimensions.height, originalPosition.y);
            element.setPosition(x, y);
        }

        // Size handling
        if (config.dimensions) {
            const width = this.calculateDimension(config.dimensions.width, this.dimensions.width, originalSize.width);
            const height = this.calculateDimension(config.dimensions.height, this.dimensions.height, originalSize.height);
            if (element.setSize) {
                element.setSize(width, height);
            }
        }

        // Depth handling
        if (config.depth !== undefined) {
            element.setDepth(config.depth);
        }

        // Font size handling
        if (config.fontSize && element.setFontSize) {
            const baseFontSize = config.fontSize.base || 16;
            const mobileFontSize = config.fontSize.mobile || baseFontSize * 0.8;
            const tabletFontSize = config.fontSize.tablet || baseFontSize * 0.9;
            const deviceFontSize = isMobile ? mobileFontSize : isTablet ? tabletFontSize : baseFontSize;
            const finalFontSize = Math.round(deviceFontSize * this.scaleRatios.uniform);
            element.setFontSize(finalFontSize);
        }

        // Visibility handling
        if (config.visibility) {
            element.setVisible(this.evaluateVisibilityCondition(config.visibility));
        }
    }

    calculatePosition(pos, containerSize, originalPos) {
        if (typeof pos === 'number') return pos * this.scaleRatios.uniform;
        if (typeof pos === 'string') {
            if (pos.endsWith('%')) {
                return (parseFloat(pos) / 100) * containerSize;
            }
            if (pos === 'center') {
                return containerSize / 2;
            }
            if (pos === 'original') {
                return originalPos * this.scaleRatios.uniform;
            }
        }
        return originalPos * this.scaleRatios.uniform;
    }

    calculateDimension(dim, containerSize, originalDim) {
        if (typeof dim === 'number') return dim * this.scaleRatios.uniform;
        if (typeof dim === 'string' && dim.endsWith('%')) {
            return (parseFloat(dim) / 100) * containerSize;
        }
        return originalDim * this.scaleRatios.uniform;
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
            pixelRatio: window.devicePixelRatio || 1,
            scaleRatios: this.scaleRatios
        };
    }
}
