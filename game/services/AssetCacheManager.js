
export default class AssetCacheManager {
    constructor() {
        this.textureCache = new Map();
        this.audioCache = new Map();
        this.maxCacheSize = 50;
    }

    preloadAssets(scene) {
        const commonAssets = [
            'tile_grass',
            'tile_grass_2',
            'tile_grass_2_flowers',
            'tile_grass_3_flowers',
            'Farmer',
            'tree_simple',
            'tree_pine'
        ];

        commonAssets.forEach(key => {
            if (!this.textureCache.has(key)) {
                scene.load.once(`filecomplete-image-${key}`, () => {
                    this.textureCache.set(key, true);
                });
            }
        });
    }

    clearUnusedAssets(scene) {
        if (this.textureCache.size > this.maxCacheSize) {
            const keysToRemove = Array.from(this.textureCache.keys())
                .slice(0, this.textureCache.size - this.maxCacheSize);
            
            keysToRemove.forEach(key => {
                scene.textures.remove(key);
                this.textureCache.delete(key);
            });
        }
    }
}
