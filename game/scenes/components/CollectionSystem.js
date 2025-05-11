
export default class CollectionSystem {
    constructor(scene) {
        this.scene = scene;
        this.collectibles = {
            'berry': '🫐',
            'mushroom': '🍄',
            'worm': '🪱',
            'bug': '🐛'
        };
    }

    startCollecting(npc) {
        const originalEmoji = npc.config.emoji;
        npc.config.emoji = '🔍';
        npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

        // Configura timer de coleta a cada 20 segundos
        npc.collectionTimer = this.scene.time.addEvent({
            delay: 20000,
            callback: () => this.collectResource(npc),
            loop: true
        });

        // Primeira coleta
        this.collectResource(npc);
    }

    collectResource(npc) {
        // Tempo de busca entre 10-15 segundos
        const searchTime = Phaser.Math.Between(10000, 15000);
        
        // Efeito de partículas durante a busca
        const searchParticles = this.scene.add.particles(0, 0, 'tile_grass', {
            x: npc.sprite.x,
            y: npc.sprite.y,
            speed: { min: 20, max: 50 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            quantity: 1,
            frequency: 200
        });

        // Após o tempo de busca, coleta um recurso
        this.scene.time.delayedCall(searchTime, () => {
            searchParticles.destroy();
            
            // Escolhe um recurso aleatório
            const resources = Object.keys(this.collectibles);
            const resource = resources[Math.floor(Math.random() * resources.length)];
            
            // Adiciona ao inventário
            if (npc.addItemToStorage(resource)) {
                console.log(`[${npc.config.name}] Coletou ${this.collectibles[resource]}`);
                npc.config.emoji = this.collectibles[resource];
            } else {
                console.log(`[${npc.config.name}] Inventário cheio!`);
                npc.config.emoji = '📦';
            }
            
            npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);

            // Reseta o emoji após 2 segundos
            this.scene.time.delayedCall(2000, () => {
                npc.config.emoji = '🔍';
                npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
            });
        });
    }

    stopCollecting(npc) {
        if (npc.collectionTimer) {
            npc.collectionTimer.remove();
        }
    }
}
