export default class MineSystem {
    constructor(scene, npc, grid, resourceSystem) {
        this.scene = scene;
        this.npc = npc; // The miner NPC this system controls
        this.grid = grid;
        this.resourceSystem = resourceSystem;
        this.targetRock = null;
        this.isWorking = false;
        this.workRange = 3; // How far the miner can look for rocks
    }

    findNearestRock() {
        let closestRock = null;
        let minDistance = Infinity;

        // Iterate over grid objects or a dedicated list of rocks
        for (const key in this.grid.buildingGrid) {
            const object = this.grid.buildingGrid[key];
            if (object.type === "rock") {
                const distance = Phaser.Math.Distance.Between(this.npc.gridX, this.npc.gridY, object.gridX, object.gridY);
                if (distance < minDistance && distance <= this.workRange) {
                    minDistance = distance;
                    closestRock = object;
                }
            }
        }
        // Fallback to ask EnvironmentManager if it tracks rocks separately
        if (!closestRock && this.scene.environmentManager) {
            closestRock = this.scene.environmentManager.findClosestRock(this.npc.gridX, this.npc.gridY, this.workRange);
        }

        return closestRock;
    }

    startWorking() {
        if (this.isWorking) return;
        this.targetRock = this.findNearestRock();
        if (!this.targetRock) {
            console.log(`${this.npc.config.name} found no rocks nearby. Idling.`);
            // Optionally, make the NPC wander or wait
            this.scene.time.delayedCall(5000, () => this.startWorking(), [], this); // Try again later
            return;
        }
        this.isWorking = true;
        this.npc.isAutonomous = false; // Take control
        console.log(`${this.npc.config.name} is starting mining work.`);
        this.workLoop();
    }

    stopWorking() {
        this.isWorking = false;
        this.npc.isAutonomous = true; // Release control
        if (this.npc.isMoving) {
            this.scene.tweens.killTweensOf(this.npc);
            this.npc.isMoving = false;
        }
        // this.npc.playIdleAnimation(); // Or stop animation
        console.log(`${this.npc.config.name} stopped mining work.`);
    }

    workLoop() {
        if (!this.isWorking) return;

        if (!this.targetRock || !this.grid.buildingGrid[`${this.targetRock.gridX},${this.targetRock.gridY}`]) {
            this.targetRock = this.findNearestRock();
            if (!this.targetRock) {
                console.log(`${this.npc.config.name} found no rocks nearby. Idling.`);
                this.scene.time.delayedCall(5000, () => this.workLoop(), [], this);
                return;
            }
        }

        const distanceToRock = Phaser.Math.Distance.Between(this.npc.gridX, this.npc.gridY, this.targetRock.gridX, this.targetRock.gridY);

        if (distanceToRock > 1) { // Needs to be adjacent to mine
            this.moveToTarget(this.targetRock);
        } else {
            this.mineRock();
        }
    }

    moveToTarget(target) {
        if (this.npc.isMoving) return;

        const path = this.findPath(this.npc.gridX, this.npc.gridY, target.gridX, target.gridY);

        if (path && path.length > 1) {
            const nextStep = path[1];
            const direction = { x: nextStep.x - this.npc.gridX, y: nextStep.y - this.npc.gridY };
            const animKey = this.getAnimKeyForDirection(direction.x, direction.y);
            
            const { tileX, tileY } = this.grid.gridToIso(nextStep.x, nextStep.y);
            this.npc.isMoving = true;
            if(animKey && this.npc.anims) this.npc.play(animKey, true);

            this.scene.tweens.add({
                targets: this.npc,
                x: this.scene.cameras.main.centerX + tileX,
                y: this.scene.cameras.main.centerY + tileY - 16, // NPC y-offset
                duration: 600,
                ease: "Linear",
                onComplete: () => {
                    this.npc.gridX = nextStep.x;
                    this.npc.gridY = nextStep.y;
                    this.npc.setDepth(nextStep.y + 1);
                    this.npc.isMoving = false;
                    if (this.npc.anims) this.npc.stop();
                    this.workLoop();
                }
            });
        } else {
            console.log(`${this.npc.config.name} cannot find path to rock or is blocked.`);
            this.scene.time.delayedCall(3000, () => this.workLoop(), [], this);
        }
    }

    mineRock() {
        if (!this.targetRock) {
            this.workLoop();
            return;
        }
        console.log(`${this.npc.config.name} is mining rock at ${this.targetRock.gridX},${this.targetRock.gridY}`);
        // this.npc.play("mine_animation"); 

        this.scene.time.delayedCall(3000, () => { // Simulate mining time
            if (!this.targetRock) return;

            const rockObject = this.grid.buildingGrid[`${this.targetRock.gridX},${this.targetRock.gridY}`];
            if (rockObject && rockObject.sprite) {
                rockObject.sprite.destroy(); 
            }
            delete this.grid.buildingGrid[`${this.targetRock.gridX},${this.targetRock.gridY}`];
            
            this.resourceSystem.addResource("ore", 5); // Add ore
            if(this.scene.uiManager) this.scene.uiManager.showFeedback("+5 Ore", true);

            this.targetRock = null; 
            this.workLoop();
        }, [], this);
    }

    // Pathfinding (can be shared with LumberSystem or a utility class)
    findPath(startX, startY, endX, endY) {
        const openSet = [];
        const closedSet = [];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startNode = { x: startX, y: startY, f: 0, g: 0 };
        gScore.set(`${startX},${startY}`, 0);
        fScore.set(`${startX},${startY}`, this.heuristic(startX, startY, endX, endY));
        openSet.push(startNode);

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();

            if (Math.abs(current.x - endX) <= 1 && Math.abs(current.y - endY) <= 1 && !(current.x === endX && current.y === endY)) {
                 if (!this.scene.buildingSystem.isTileOccupiedByBuilding(current.x, current.y) || (current.x === startX && current.y === startY)){
                    return this.reconstructPath(cameFrom, current);
                }
            }
            if (current.x === endX && current.y === endY) {
                 return this.reconstructPath(cameFrom, current);
            }

            closedSet.push(`${current.x},${current.y}`);

            this.getNeighbors(current.x, current.y).forEach(neighbor => {
                if (closedSet.includes(`${neighbor.x},${neighbor.y}`)) return;
                if (neighbor.x === endX && neighbor.y === endY) { 
                    // Pathing to the rock itself
                } else if (this.scene.buildingSystem.isTileOccupiedByBuilding(neighbor.x, neighbor.y)) {
                    return;
                }

                const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1;
                if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y) || tentativeGScore < gScore.get(`${neighbor.x},${neighbor.y}`)) {
                    cameFrom.set(`${neighbor.x},${neighbor.y}`, current);
                    gScore.set(`${neighbor.x},${neighbor.y}`, tentativeGScore);
                    const h = (neighbor.x === endX && neighbor.y === endY) ? 0 : this.heuristic(neighbor.x, neighbor.y, endX, endY);
                    fScore.set(`${neighbor.x},${neighbor.y}`, tentativeGScore + h);
                    if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push({ x: neighbor.x, y: neighbor.y, f: fScore.get(`${neighbor.x},${neighbor.y}`), g: tentativeGScore });
                    }
                }
            });
        }
        return null;
    }

    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    reconstructPath(cameFrom, current) {
        const totalPath = [{ x: current.x, y: current.y }];
        let currentKey = `${current.x},${current.y}`;
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            totalPath.unshift({ x: current.x, y: current.y });
            currentKey = `${current.x},${current.y}`;
        }
        return totalPath;
    }

    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            if (this.grid.isValidPosition(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        return neighbors;
    }
    
    getAnimKeyForDirection(dx, dy) {
        // Assuming miner has similar animations to farmer, or specific ones like 'miner_up'
        // This should be adapted if miner animations are different
        if (dy < 0) return this.npc.config.profession === "Farmer" ? "farmer_up" : "miner_up"; // Placeholder
        if (dy > 0) return this.npc.config.profession === "Farmer" ? "farmer_down" : "miner_down";
        if (dx < 0) return this.npc.config.profession === "Farmer" ? "farmer_left" : "miner_left";
        if (dx > 0) return this.npc.config.profession === "Farmer" ? "farmer_right" : "miner_right";
        return null;
    }

    update() {
        if (this.isWorking && !this.npc.isMoving) {
            // Logic handled by callbacks
        }
    }
}

