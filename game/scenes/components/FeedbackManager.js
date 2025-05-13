
export default class FeedbackManager {
    constructor(scene) {
        this.scene = scene;
        this.feedbacks = new Map();
    }

    clearTileHighlights() {
        this.scene.grid.grid.flat().forEach(tile => {
            tile.clearTint();
        });
    }

    updateTileHighlights() {
        this.scene.grid.grid.flat().forEach(tile => {
            const gridPosition = tile.data;
            const key = `${gridPosition.gridX},${gridPosition.gridY}`;

            if (this.scene.grid.buildingGrid[key]) {
                tile.setTint(0xFF0000);
            } else if (this.scene.grid.isValidPosition(gridPosition.gridX, gridPosition.gridY)) {
                tile.setTint(0x00FF00);
            } else {
                tile.setTint(0xFF0000);
            }
        });
    }

    showFeedback(message, isSuccess = true, duration = 2000) {
        const text = this.scene.add.text(
            this.scene.cameras.main.centerX,
            100,
            message,
            {
                fontSize: '20px',
                color: isSuccess ? '#00ff00' : '#ff0000',
                backgroundColor: '#00000088',
                padding: { x: 10, y: 5 }
            }
        );
        text.setScrollFactor(0);
        text.setDepth(1000);
        text.setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            alpha: { from: 1, to: 0 },
            duration: duration,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    showParticles(x, y, texture = 'tile_grass', config = {}) {
        const defaultConfig = {
            speed: 150,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            quantity: 6,
            emitting: false
        };

        const particles = this.scene.add.particles(0, 0, texture, {
            ...defaultConfig,
            ...config,
            x, y
        });

        particles.start();
        this.scene.time.delayedCall(500, () => particles.destroy());
    }
}
