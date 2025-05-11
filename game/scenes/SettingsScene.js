
import BaseScene from './BaseScene.js';

export default class SettingsScene extends BaseScene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        super.create();
        console.log('SettingsScene iniciada');
        this.createUI();
    }

    createUI() {
        const width = this.screenDimensions.width;
        const height = this.screenDimensions.height;
        
        // Implementar interface de configurações aqui
        // Usando this.screenDimensions para layouts responsivos
    }

    onDimensionsUpdate() {
        if (this.container) {
            this.createUI();
        }
    }
}
