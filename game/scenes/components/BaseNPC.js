
export default class BaseNPC {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.gridX = x;
        this.gridY = y;
        this.isMoving = false;
        this.isAutonomous = true;
        
        const {tileX, tileY} = scene.grid.gridToIso(x, y);
        
        // Create sprite
        this.sprite = scene.add.sprite(
            scene.cameras.main.centerX + tileX,
            scene.cameras.main.centerY + tileY - 32,
            'farmer1'
        );
        
        // Create name text
        this.nameText = scene.add.text(
            scene.cameras.main.centerX + tileX,
            scene.cameras.main.centerY + tileY - 64,
            `${config.emoji} ${config.name}`,
            {
                fontSize: '14px',
                fill: '#ffffff',
                backgroundColor: '#00000088',
                padding: { x: 4, y: 2 }
            }
        ).setOrigin(0.5);

        this.sprite.setScale(config.scale || 0.8);
        this.sprite.setDepth(y + 2);
        this.nameText.setDepth(y + 2);

        // Create animations if they don't exist
        this.createAnimations();
    }

    createAnimations() {
        const frameRate = 8;
        const repeat = -1;
        
        if (!this.scene.anims.exists('farmer_walk')) {
            this.scene.anims.create({
                key: 'farmer_walk',
                frames: [
                    { key: 'farmer1' },
                    { key: 'farmer2' },
                    { key: 'farmer3' },
                    { key: 'farmer4' }
                ],
                frameRate,
                repeat
            });
        }

        if (!this.scene.anims.exists('farmer_up')) {
            this.scene.anims.create({
                key: 'farmer_up',
                frames: [
                    { key: 'farmer1' },
                    { key: 'farmer2' },
                    { key: 'farmer3' },
                    { key: 'farmer4' }
                ],
                frameRate,
                repeat
            });
        }

        if (!this.scene.anims.exists('farmer_down')) {
            this.scene.anims.create({
                key: 'farmer_down',
                frames: [
                    { key: 'farmer9' },
                    { key: 'farmer10' },
                    { key: 'farmer11' },
                    { key: 'farmer12' }
                ],
                frameRate,
                repeat
            });
        }

        if (!this.scene.anims.exists('farmer_left')) {
            this.scene.anims.create({
                key: 'farmer_left',
                frames: [
                    { key: 'farmer5' },
                    { key: 'farmer6' },
                    { key: 'farmer7' },
                    { key: 'farmer8' }
                ],
                frameRate,
                repeat
            });
        }

        if (!this.scene.anims.exists('farmer_right')) {
            this.scene.anims.create({
                key: 'farmer_right',
                frames: [
                    { key: 'farmer1' },
                    { key: 'farmer2' },
                    { key: 'farmer3' },
                    { key: 'farmer4' }
                ],
                frameRate,
                repeat
            });
        }
    }
}
