import LumberSystem from "./LumberSystem.js"; // Assuming LumberSystem will also be a module
import MineSystem from "./MineSystem.js";   // Assuming MineSystem will also be a module

export default class CharacterManager {
    constructor(scene, grid, gameDataManager) {
        this.scene = scene;
        this.grid = grid;
        this.gameDataManager = gameDataManager; // For names, emojis
        this.farmer = null;
        this.farmerCreated = false;
        this.keys = {};
        this.npcs = []; // To store other NPCs
    }

    init() {
        // Initialize keyboard controls for the main farmer
        this.keys = this.scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });

        // The original code had a keydown listener on the scene.
        // It might be better to handle it here or ensure the scene calls an update method here.
        // For now, let's assume the scene's update will call this.updateFarmerMovement()

        this.setupMobileControls();
    }

    setupMobileControls() {
        if ("ontouchstart" in window) {
            const buttons = {
                "mobile-up": "W",
                "mobile-down": "S",
                "mobile-left": "A",
                "mobile-right": "D"
            };

            Object.entries(buttons).forEach(([className, key]) => {
                const button = document.querySelector(`.${className}`);
                if (button) {
                    button.addEventListener("touchstart", (e) => {
                        e.preventDefault();
                        this.keys[key.toLowerCase()].isDown = true;
                    });
                    button.addEventListener("touchend", (e) => {
                        e.preventDefault();
                        this.keys[key.toLowerCase()].isDown = false;
                    });
                }
            });
        }
    }

    createPlayerFarmer() {
        if (this.farmerCreated) return;
        this.farmerCreated = true;

        const frames = [];
        for (let i = 1; i <= 12; i++) {
            const key = `farmer${i}`;
            // Asset loading should be done by AssetLoader, assume they are loaded
            if (!this.scene.textures.exists(key)) {
                console.warn(`Texture ${key} not found for farmer. Make sure AssetLoader ran.`);
                // As a fallback, or if dynamic loading is intended here:
                // this.scene.load.image(key, `attached_assets/Farmer_${i}-ezgif.com-resize.png`);
            }
            frames.push({ key });
        }
        // this.scene.load.once("complete", () => { // This should be handled by AssetLoader completion
        this.scene.anims.create({
            key: "farmer_walk", // Generic walk, specific directions handled by playing the right anim
            frames: frames,
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: "farmer_up",
            frames: this.scene.anims.generateFrameNumbers("farmer_walk", { start: 0, end: 3 }), // Assuming frames are in order: up, left, down, right
            // Adjust based on actual sprite sheet. Original used specific farmer1-12 keys.
            // For simplicity, let's stick to the original frame definitions if they are distinct files.
            frames: [
                { key: "farmer1" }, { key: "farmer2" }, { key: "farmer3" }, { key: "farmer4" }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: "farmer_down",
            frames: [
                { key: "farmer9" }, { key: "farmer10" }, { key: "farmer11" }, { key: "farmer12" }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: "farmer_left",
            frames: [
                { key: "farmer5" }, { key: "farmer6" }, { key: "farmer7" }, { key: "farmer8" }
            ],
            frameRate: 8,
            repeat: -1
        });

        // Right animation was same as farmer1-4, which is 'up' in this new mapping. Let's assume it's a distinct set or re-use 'up'.
        // Original: farmer_right -> farmer1, farmer2, farmer3, farmer4. This is the same as farmer_up.
        // This might be an error in the original or specific to the asset.
        // For now, let's assume 'farmer_right' uses the same frames as 'farmer_up' or needs its own set.
        // To avoid confusion, if right is truly different, it needs its own frames.
        // If it's mirrored, Phaser can handle that with flipX.
        // Let's assume for now it was intended to be distinct or a copy of 'up'.
        this.scene.anims.create({
            key: "farmer_right", // If it's just flipped 'left', we can do farmer.setFlipX(true)
            frames: [
                { key: "farmer1" }, { key: "farmer2" }, { key: "farmer3" }, { key: "farmer4" } // Placeholder, same as up
            ],
            frameRate: 8,
            repeat: -1
        });

        const startX = Math.floor(this.grid.width / 2);
        const startY = Math.floor(this.grid.height / 2);
        const { tileX, tileY } = this.grid.gridToIso(startX, startY);

        this.farmer = this.scene.add.sprite(
            this.scene.cameras.main.centerX + tileX,
            this.scene.cameras.main.centerY + tileY - 16, // Y offset
            "farmer1" // Initial frame
        );

        this.farmer.gridX = startX;
        this.farmer.gridY = startY;
        this.farmer.setScale(0.8);
        this.farmer.setDepth(startY + 1);
        this.farmer.isMoving = false;

        this.scene.cameras.main.startFollow(this.farmer, true, 0.08, 0.08); // Smoother follow
        // });
        // this.scene.load.start(); // AssetLoader handles this
    }

    updateFarmerMovement() {
        if (!this.farmer || this.farmer.isMoving) return;

        let direction = null;
        let animKey = null;

        if (this.keys.w.isDown) {
            direction = { x: 0, y: -1 };
            animKey = "farmer_up";
        } else if (this.keys.s.isDown) {
            direction = { x: 0, y: 1 };
            animKey = "farmer_down";
        } else if (this.keys.a.isDown) {
            direction = { x: -1, y: 0 };
            animKey = "farmer_left";
        } else if (this.keys.d.isDown) {
            direction = { x: 1, y: 0 };
            animKey = "farmer_right";
        }

        if (direction) {
            const newX = this.farmer.gridX + direction.x;
            const newY = this.farmer.gridY + direction.y;

            if (this.grid.isValidPosition(newX, newY) && !this.scene.buildingSystem.isTileOccupiedByBuilding(newX, newY)) {
                this.moveFarmer(direction, animKey);
            }
        }
    }

    moveFarmer(direction, animKey) {
        const newX = this.farmer.gridX + direction.x;
        const newY = this.farmer.gridY + direction.y;
        const { tileX, tileY } = this.grid.gridToIso(newX, newY);

        this.farmer.isMoving = true;
        this.farmer.play(animKey);

        this.scene.tweens.add({
            targets: this.farmer,
            x: this.scene.cameras.main.centerX + tileX,
            y: this.scene.cameras.main.centerY + tileY - 16, // Y offset
            duration: 500, // Slightly faster
            ease: "Linear", // Linear for grid movement often feels better
            onComplete: () => {
                this.farmer.gridX = newX;
                this.farmer.gridY = newY;
                this.farmer.setDepth(newY + 1);
                this.farmer.isMoving = false;
                this.farmer.stop(); // Stop animation or show idle frame
                // this.scene.events.emit("farmerMoved"); // MainScene can listen if needed
            }
        });
    }

    // NPC Creation and Management
    async createFarmerNPC(gridX, gridY, worldX, worldY, houseType) {
        // This function was complex and tied to building placement.
        // It might be better if BuildingSystem calls this after a house is placed.
        const npcConfig = this.gameDataManager.professionNames[houseType] || { prefix: "Villager", names: ["NPC"] };
        const randomName = npcConfig.names[Math.floor(Math.random() * npcConfig.names.length)];
        const profession = npcConfig.prefix;
        const emoji = this.gameDataManager.getProfessionEmoji(profession);

        // Simplified NPC sprite - assuming a generic villager sprite or needs specific assets
        // For now, let's use the farmer sprite as a placeholder if no other is defined
        const npc = this.scene.add.sprite(worldX, worldY -16, "farmer1"); // Placeholder sprite
        npc.gridX = gridX;
        npc.gridY = gridY;
        npc.setScale(0.7);
        npc.setDepth(gridY + 1);
        npc.isMoving = false;
        npc.isAutonomous = true; // Default
        npc.config = {
            name: `${profession} ${randomName}`,
            emoji: emoji,
            profession: profession,
            houseType: houseType
        };

        npc.nameText = this.scene.add.text(npc.x, npc.y - npc.displayHeight, `${emoji} ${npc.config.name}`, {
            fontSize: "10px",
            fill: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: { x: 2, y: 1 }
        }).setOrigin(0.5, 1);
        npc.nameText.setDepth(npc.depth + 1000); // Ensure name is on top

        this.npcs.push(npc);
        console.log(`Created NPC: ${npc.config.name} at ${gridX},${gridY}`);

        // Attach specific AI/systems based on profession
        if (houseType === "lumberHouse") {
            npc.lumberSystem = new LumberSystem(this.scene, npc, this.grid, this.scene.resourceSystem);
            npc.isAutonomous = false; // As per original logic
            npc.currentJob = "lumber";
            npc.lumberSystem.startWorking(); 
            console.log(`Lumberjack ${npc.config.name} starting work.`);
        } else if (houseType === "minerHouse") {
            npc.mineSystem = new MineSystem(this.scene, npc, this.grid, this.scene.resourceSystem);
            npc.isAutonomous = false; // As per original logic
            npc.currentJob = "mine";
            if (npc.mineSystem.findNearestRock()) {
                 npc.mineSystem.startWorking();
                 console.log(`Miner ${npc.config.name} starting work.`);
            } else {
                console.log(`No nearby rocks for Miner ${npc.config.name}.`);
            }
        }

        return npc;
    }
    
    updateNPCs() {
        this.npcs.forEach(npc => {
            if (npc.nameText) {
                npc.nameText.setPosition(npc.x, npc.y - npc.displayHeight * 0.5); // Adjust name tag position
            }
            if (npc.isAutonomous && !npc.isMoving) {
                // Basic random movement for autonomous NPCs (if any)
                // This part needs more sophisticated AI logic if complex behavior is desired
            } else if (npc.lumberSystem && npc.currentJob === "lumber") {
                npc.lumberSystem.update();
            } else if (npc.mineSystem && npc.currentJob === "mine") {
                npc.mineSystem.update();
            }
        });
    }

    // Called by MainScene's update method
    update() {
        this.updateFarmerMovement();
        this.updateNPCs();
    }
}

