export default class GameDataManager {
    constructor(scene) {
        this.scene = scene;
        // Emoji mapping for professions
        this.professionEmojis = {
            "Farmer": "🥕",
            "Miner": "⛏️",
            "Fisher": "🎣",
            "Lumberjack": "🪓",
            "Villager": "👤"
        };
        this.professionNames = {
            farmerHouse: {
                prefix: "Farmer",
                names: ["John", "Peter", "Mary", "Lucas", "Emma", "Sofia", "Miguel", "Julia"]
            },
            FishermanHouse: {
                prefix: "Fisher",
                names: ["Jack", "Tom", "Nina", "Marco", "Ana", "Leo", "Luna", "Kai"]
            },
            minerHouse: {
                prefix: "Miner",
                names: ["Max", "Sam", "Alex", "Cole", "Ruby", "Jade", "Rocky", "Crystal"]
            },
            lumberHouse: {
                prefix: "Lumberjack",
                names: ["Paul", "Jack", "Woody", "Axel", "Oak", "Forest", "Timber", "Cedar"]
            }
        };
    }

    getProfessionEmoji(profession) {
        return this.professionEmojis[profession] || "👤";
    }

    getRandomName(houseType) {
        const config = this.professionNames[houseType];
        if (config && config.names && config.names.length > 0) {
            const randomIndex = Math.floor(Math.random() * config.names.length);
            return `${config.prefix} ${config.names[randomIndex]}`;
        }
        return "Villager NPC"; // Default name
    }

    autoSave() {
        if (!this.scene.characterManager || !this.scene.characterManager.farmer) return;

        try {
            const gameState = {
                buildingGrid: {},
                farmerPosition: {
                    x: this.scene.characterManager.farmer.gridX,
                    y: this.scene.characterManager.farmer.gridY
                },
                resources: this.scene.resourceSystem ? this.scene.resourceSystem.getAllResources() : { wood: 0, wheat: 0, ore: 0 },
                // Outros dados relevantes podem ser adicionados aqui
            };

            // Convert building grid to a serializable format
            if (this.scene.grid && this.scene.grid.buildingGrid) {
                Object.entries(this.scene.grid.buildingGrid).forEach(([key, value]) => {
                    gameState.buildingGrid[key] = {
                        type: value.type,
                        gridX: value.gridX,
                        gridY: value.gridY,
                        buildingType: value.sprite ? value.sprite.texture.key : (value.buildingType || null)
                    };
                });
            }

            const saveIndicator = document.querySelector(".save-indicator");
            if (saveIndicator) {
                saveIndicator.classList.add("saving");
                setTimeout(() => {
                    saveIndicator.classList.remove("saving");
                }, 1000);
            }

            localStorage.setItem("gameState", JSON.stringify(gameState));
            console.log("Game saved successfully by GameDataManager");
        } catch (error) {
            console.error("Error saving game via GameDataManager:", error);
        }
    }

    loadGame() {
        const savedData = localStorage.getItem("gameState");
        if (savedData) {
            try {
                const gameState = JSON.parse(savedData);
                console.log("Game loaded successfully by GameDataManager", gameState);
                return gameState;
            } catch (error) {
                console.error("Error loading game via GameDataManager:", error);
                return null;
            }
        }
        return null;
    }
}

