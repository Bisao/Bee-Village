
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
        
        // Create settings panel
        const panel = this.add.rectangle(width/2, height/2, 400, 300, 0x2d2d2d)
            .setStrokeStyle(2, 0xffffff);
            
        const title = this.add.text(width/2, height/2 - 120, 'Settings', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Create settings controls
        const controls = [
            { label: 'Music Volume', value: 50 },
            { label: 'Sound Effects', value: 75 },
            { label: 'Display Quality', value: 'High' }
        ];

        controls.forEach((control, index) => {
            const y = height/2 - 50 + (index * 50);
            
            this.add.text(width/2 - 150, y, control.label, {
                fontSize: '16px',
                fill: '#ffffff'
            });

            if (typeof control.value === 'number') {
                this.add.rectangle(width/2 + 50, y + 10, 100, 10, 0x4a4a4a)
                    .setInteractive();
            } else {
                this.add.text(width/2 + 50, y, control.value, {
                    fontSize: '16px',
                    fill: '#ffffff'
                });
            }
        });

        // Add back button
        const backBtn = this.add.text(width/2, height/2 + 100, 'Back', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive();

        backBtn.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
    }

    onDimensionsUpdate() {
        if (this.container) {
            this.createUI();
        }
    }
}
