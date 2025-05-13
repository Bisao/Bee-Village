export default class MovementManager {
    constructor(scene) {
        this.scene = scene;
    }

    moveNPCTo(npc, newX, newY) {
        if (npc.isMoving) return;

        const {tileX, tileY} = this.scene.grid.gridToIso(newX, newY);
        npc.isMoving = true;

        const animKey = this.getAnimationKey(npc.gridX, npc.gridY, newX, newY);
        this.playAnimation(npc, animKey);

        this.createMovementTween(npc, tileX, tileY, newX, newY);
    }

    getAnimationKey(currentX, currentY, newX, newY) {
        if (newY < currentY) return 'farmer_up';
        if (newY > currentY) return 'farmer_down';
        if (newX < currentX) return 'farmer_left';
        return 'farmer_right';
    }

    playAnimation(npc, animKey) {
        if (this.scene.anims.exists(animKey)) {
            npc.sprite.play(animKey, true);
        } else {
            console.warn(`Animation ${animKey} not found`);
            npc.sprite.setTexture('farmer1');
        }
    }

    createMovementTween(npc, tileX, tileY, newX, newY) {
        this.scene.tweens.add({
            targets: [npc.sprite, npc.nameText],
            x: this.scene.cameras.main.centerX + tileX,
            y: function (target, key, value, targetIndex) {
                const baseY = this.scene.cameras.main.centerY + tileY;
                return targetIndex === 0 ? baseY - 32 : baseY - 64;
            },
            duration: 600,
            ease: 'Linear',
            onComplete: () => {
                npc.gridX = newX;
                npc.gridY = newY;
                npc.sprite.setDepth(newY + 2);
                npc.isMoving = false;
                npc.sprite.stop();
            }
        });
    }

    getAvailableDirections(fromX, fromY) {
        const directions = [
            { x: 1, y: 0 },   // direita
            { x: -1, y: 0 },  // esquerda
            { x: 0, y: 1 },   // baixo
            { x: 0, y: -1 }   // cima
        ];

        return directions.filter(dir => {
            const newX = fromX + dir.x;
            const newY = fromY + dir.y;
            return this.scene.grid.isValidPosition(newX, newY) && 
                   !this.scene.isTileOccupied(newX, newY);
        });
    }
}