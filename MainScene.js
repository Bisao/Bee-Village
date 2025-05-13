placeBuilding(gridX, gridY, worldX, worldY) {
    return this.buildingManager.placeBuilding(gridX, gridY, worldX, worldY, this.selectedBuilding);
}

autoSave() {
        return this.saveManager.autoSave();
    }

    // Resource management moved to ResourceSystem.js

    preload() {
        this.assetManager = new AssetManager(this);
        this.assetManager.loadAssets();
    }

this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.updatePreview, this);

        this.environmentManager.placeInitialEnvironment();