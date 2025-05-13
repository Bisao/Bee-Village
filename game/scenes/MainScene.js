import Grid from "../components/Grid.js"; // Assuming Grid.js is in a components folder relative to scenes
import InputManager from "../components/InputManager.js"; // Assuming InputManager.js is in a components folder
import ResourceSystem from "../components/ResourceSystem.js"; // Assuming ResourceSystem.js is in a components folder

import AssetLoader from "./modules/AssetLoader.js";
import GameDataManager from "./modules/GameDataManager.js";
import UIManager from "./modules/UIManager.js";
import CharacterManager from "./modules/CharacterManager.js";
import EnvironmentManager from "./modules/EnvironmentManager.js";
import BuildingSystem from "./modules/BuildingSystem.js";
// LumberSystem and MineSystem are now typically instantiated by CharacterManager or BuildingSystem as needed.

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
        // Systems will be initialized in create
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadGameAssets(); // This also sets up the 'ready' event emitter
    }

    create() {
        // Wait for assets to load if a key asset isn't present (e.g., tile_grass)
        // The 'ready' event from AssetLoader can also be used.
        this.game.events.once("ready", this.onAssetsReady, this);
        if (this.textures.exists("tile_grass")) { // If assets are already loaded (e.g. from cache)
            this.onAssetsReady();
        }
    }

    onAssetsReady() {
        if (this.sys.game.isBooted) { // Check if scene is still active
            console.log("Assets are ready, initializing scene systems.");
        } else {
            return; // Scene might have been shut down
        }

        // Initialize core components
        this.grid = new Grid(this, 10, 10); // Grid dimensions as per original
        this.grid.create();

        // Initialize systems (order might matter for dependencies)
        this.resourceSystem = new ResourceSystem(this);
        this.gameDataManager = new GameDataManager(this);
        this.uiManager = new UIManager(this);
        this.characterManager = new CharacterManager(this, this.grid, this.gameDataManager);
        this.environmentManager = new EnvironmentManager(this, this.grid);
        this.buildingSystem = new BuildingSystem(this, this.grid, this.resourceSystem, this.uiManager, this.characterManager, this.gameDataManager);
        
        // Pass necessary systems to other systems that need them (if not done in constructor)
        // e.g., UIManager might need a reference to buildingSystem for some actions
        this.uiManager.buildingSystem = this.buildingSystem; // Example of cross-reference if needed
        // CharacterManager might need buildingSystem to check for occupied tiles
        this.characterManager.buildingSystem = this.buildingSystem; 

        // Initialize UI and Input
        this.uiManager.init(); // Sets up DOM element handlers
        // The original InputManager might not be needed if all input is handled by specific systems or scene directly
        // this.inputManager = new InputManager(this);
        // this.inputManager.init();

        // Setup scene-specific input handlers
        this.input.on("pointerdown", this.handleSceneClick, this);
        this.input.on("pointermove", this.handleScenePointerMove, this);

        // Initial game setup
        this.environmentManager.placeInitialScenery();
        this.characterManager.createPlayerFarmer(); // Create the player character
        this.characterManager.init(); // Initialize controls for player

        // Initial building placements (example from original)
        // Need to calculate worldX, worldY correctly
        let isoPos = this.grid.gridToIso(1, 1);
        this.buildingSystem.placeBuilding(1, 1, this.cameras.main.centerX + isoPos.tileX, this.cameras.main.centerY + isoPos.tileY, "lumberHouse");
        isoPos = this.grid.gridToIso(3, 1);
        this.buildingSystem.placeBuilding(3, 1, this.cameras.main.centerX + isoPos.tileX, this.cameras.main.centerY + isoPos.tileY, "silo");

        // Camera setup
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const initialZoom = isMobile ? 0.8 : 1.5;
        this.cameras.main.setZoom(initialZoom);
        // Camera follow is handled by CharacterManager for the player

        // Load game state if available
        const savedState = this.gameDataManager.loadGame();
        if (savedState) {
            this.applyGameState(savedState);
        }

        // Setup auto-save interval
        this.time.addEvent({
            delay: 30000, // 30 seconds
            callback: () => this.gameDataManager.autoSave(),
            callbackScope: this,
            loop: true
        });

        // Dynamic import of UIController if still used separately
        // import("./components/UI/UIController.js").then(({ default: UIController }) => {
        //     this.uiController = new UIController(this);
        //     this.uiController.init();
        // });
        console.log("MainScene creation complete.");
    }

    applyGameState(gameState) {
        // Apply resources
        if (gameState.resources && this.resourceSystem) {
            this.resourceSystem.setAllResources(gameState.resources);
        }

        // Apply buildings (clear existing non-environment objects first)
        if (gameState.buildingGrid) {
            for (const key in this.grid.buildingGrid) {
                const obj = this.grid.buildingGrid[key];
                if (obj.type === 'building' && obj.sprite) {
                    obj.sprite.destroy();
                    delete this.grid.buildingGrid[key];
                }
            }
            for (const key in gameState.buildingGrid) {
                const buildingData = gameState.buildingGrid[key];
                if (buildingData.type === 'building' && buildingData.buildingType) {
                    const isoPos = this.grid.gridToIso(buildingData.gridX, buildingData.gridY);
                    this.buildingSystem.placeBuilding(
                        buildingData.gridX, 
                        buildingData.gridY, 
                        this.cameras.main.centerX + isoPos.tileX, 
                        this.cameras.main.centerY + isoPos.tileY, 
                        buildingData.buildingType
                    );
                }
            }
        }
        // Apply farmer position
        if (gameState.farmerPosition && this.characterManager && this.characterManager.farmer) {
            const farmer = this.characterManager.farmer;
            farmer.gridX = gameState.farmerPosition.x;
            farmer.gridY = gameState.farmerPosition.y;
            const isoPos = this.grid.gridToIso(farmer.gridX, farmer.gridY);
            farmer.setPosition(this.cameras.main.centerX + isoPos.tileX, this.cameras.main.centerY + isoPos.tileY - 16);
            farmer.setDepth(farmer.gridY + 1);
        }
        console.log("Applied saved game state.");
    }

    handleSceneClick(pointer) {
        // Check if UI manager wants to intercept the click (e.g., clicked on a UI element)
        // if (this.uiManager && this.uiManager.isPointerOverUI(pointer)) return;

        // Delegate to BuildingSystem for placing buildings
        if (this.buildingSystem) {
            this.buildingSystem.handlePlacementClick(pointer);
        }
        // Other click handling logic can go here or be delegated
    }

    handleScenePointerMove(pointer) {
        // Delegate to BuildingSystem for updating placement preview
        if (this.buildingSystem) {
            this.buildingSystem.updatePreview(pointer);
        }
    }

    update(time, delta) {
        if (!this.characterManager || !this.buildingSystem) {
            // Systems not ready yet
            return;
        }
        // Delegate updates to relevant systems
        this.characterManager.update(time, delta);
        // this.buildingSystem.update(time, delta); // If BuildingSystem needs an update loop
        // this.uiManager.update(time, delta); // If UIManager needs an update loop
    }
}

