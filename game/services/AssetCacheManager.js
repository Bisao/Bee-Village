
export default class AssetCacheManager {
    constructor(scene) {
        this.scene = scene;
        this.cache = new Map();
        this.maxCacheSize = 100;
    }

    preloadAsset(key, path) {
        if (!this.cache.has(key)) {
            this.scene.load.image(key, path);
            this.cache.set(key, {
                path: path,
                lastUsed: Date.now()
            });
        }
    }

    getAsset(key) {
        if (this.cache.has(key)) {
            const asset = this.cache.get(key);
            asset.lastUsed = Date.now();
            return this.scene.textures.get(key);
        }
        return null;
    }

    clearOldCache() {
        if (this.cache.size > this.maxCacheSize) {
            const sortedAssets = Array.from(this.cache.entries())
                .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
            
            // Remove os 20% mais antigos
            const removeCount = Math.floor(this.cache.size * 0.2);
            for (let i = 0; i < removeCount; i++) {
                const [key] = sortedAssets[i];
                this.cache.delete(key);
                this.scene.textures.remove(key);
            }
        }
    }
}
export default class AssetCacheManager {
    constructor(scene) {
        this.scene = scene;
        this.assetCache = new Map();
    }

    preloadAssets() {
        // Asset preloading will be implemented here
    }

    getAsset(key) {
        return this.assetCache.get(key);
    }
}
