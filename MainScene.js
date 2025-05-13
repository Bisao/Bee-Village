placeBuilding(gridX, gridY, worldX, worldY) {
    return this.buildingManager.placeBuilding(gridX, gridY, worldX, worldY, this.selectedBuilding);
}

autoSave() {
        return this.saveManager.autoSave();
    }

    // Resource management moved to ResourceSystem.js

    preload() {
        this.initializationManager = new InitializationManager(this);
        this.initializationManager.preload();
    }
createFarmer() {
        if (this.farmerCreated) return;
        this.farmerCreated = true;

        // Animation system moved to AnimationManager
        this.animationManager.createFarmerAnimations();
}