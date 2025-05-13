export default class LumberSystem {
    constructor(scene, npc, grid, resourceSystem) {
        this.scene = scene;
        this.npc = npc; // The lumberjack NPC this system controls
        this.grid = grid;
        this.resourceSystem = resourceSystem;
        this.targetTree = null;
        this.isWorking = false;
        this.workRange = 2; // How far the lumberjack can look for trees
    }

    findNearestTree() {
        let closestTree = null;
        let minDistance = Infinity;

        // Iterate over grid objects or a dedicated list of trees
        // This assumes trees are stored in grid.buildingGrid or a similar structure
        for (const key in this.grid.buildingGrid) {
            const object = this.grid.buildingGrid[key];
            if (object.type === 'tree') {
                const distance = Phaser.Math.Distance.Between(this.npc.gridX, this.npc.gridY, object.gridX, object.gridY);
                if (distance < minDistance && distance <= this.workRange) {
                    minDistance = distance;
                    closestTree = object;
                }
            }
        }
        // A more robust way would be to have EnvironmentManager provide a list of trees
        // Or query the grid for tree objects within a certain range
        // For now, this is a simplified search based on the original structure
        if (!closestTree && this.scene.environmentManager) {
             // Fallback to ask EnvironmentManager if it tracks trees separately
            closestTree = this.scene.environmentManager.findClosestTree(this.npc.gridX, this.npc.gridY, this.workRange);
        }

        return closestTree;
    }

    startWorking() {
        if (this.isWorking) return;
        this.isWorking = true;
        this.npc.isAutonomous = false; // Take control
        console.log(`${this.npc.config.name} is starting lumber work.`);
        this.workLoop();
    }

    stopWorking() {
        this.isWorking = false;
        this.npc.isAutonomous = true; // Release control
        if (this.npc.isMoving) {
            // Stop any current movement tween
            this.scene.tweens.killTweensOf(this.npc);
            this.npc.isMoving = false;
        }
        this.npc.playIdleAnimation(); // Or stop animation
        console.log(`${this.npc.config.name} stopped lumber work.`);
    }

    workLoop() {
        if (!this.isWorking) return;

        if (!this.targetTree || !this.grid.buildingGrid[`${this.targetTree.gridX},${this.targetTree.gridY}`]) {
            this.targetTree = this.findNearestTree();
            if (!this.targetTree) {
                console.log(`${this.npc.config.name} found no trees nearby. Idling.`);
                // Wait and try again later, or move to a different area
                this.scene.time.delayedCall(5000, () => this.workLoop(), [], this);
                return;
            }
        }

        const distanceToTree = Phaser.Math.Distance.Between(this.npc.gridX, this.npc.gridY, this.targetTree.gridX, this.targetTree.gridY);

        if (distanceToTree > 1) { // Needs to be adjacent to chop
            this.moveToTarget(this.targetTree);
        } else {
            this.chopTree();
        }
    }

    moveToTarget(target) {
        if (this.npc.isMoving) return;

        const path = this.findPath(this.npc.gridX, this.npc.gridY, target.gridX, target.gridY);

        if (path && path.length > 1) { // path[0] is current position
            const nextStep = path[1]; // Move to the first step in the path
            const direction = { x: nextStep.x - this.npc.gridX, y: nextStep.y - this.npc.gridY };
            const animKey = this.getAnimKeyForDirection(direction.x, direction.y);
            
            const { tileX, tileY } = this.grid.gridToIso(nextStep.x, nextStep.y);
            this.npc.isMoving = true;
            if(animKey) this.npc.play(animKey);

            this.scene.tweens.add({
                targets: this.npc,
                x: this.scene.cameras.main.centerX + tileX,
                y: this.scene.cameras.main.centerY + tileY - 16, // NPC y-offset
                duration: 600,
                ease: 'Linear',
                onComplete: () => {
                    this.npc.gridX = nextStep.x;
                    this.npc.gridY = nextStep.y;
                    this.npc.setDepth(nextStep.y + 1);
                    this.npc.isMoving = false;
                    if (this.npc.anims) this.npc.stop();
                    this.workLoop(); // Continue work loop
                }
            });
        } else {
            // No path or already at target (or adjacent)
            console.log(`${this.npc.config.name} cannot find path or is blocked.`);
            this.scene.time.delayedCall(3000, () => this.workLoop(), [], this); // Try again later
        }
    }

    chopTree() {
        if (!this.targetTree) {
            this.workLoop();
            return;
        }
        console.log(`${this.npc.config.name} is chopping tree at ${this.targetTree.gridX},${this.targetTree.gridY}`);
        // Play chopping animation
        // this.npc.play('chop_animation'); 

        this.scene.time.delayedCall(2000, () => { // Simulate chopping time
            if (!this.targetTree) return; // Tree might have been removed by other means
            
            const treeObject = this.grid.buildingGrid[`${this.targetTree.gridX},${this.targetTree.gridY}`];
            if (treeObject && treeObject.sprite) {
                treeObject.sprite.destroy(); // Remove tree sprite
            }
            delete this.grid.buildingGrid[`${this.targetTree.gridX},${this.targetTree.gridY}`]; // Remove from grid data
            
            this.resourceSystem.addResource('wood', 10); // Add wood to resources
            if(this.scene.uiManager) this.scene.uiManager.showFeedback('+10 Wood', true);

            this.targetTree = null; // Look for a new tree
            this.workLoop();
        }, [], this);
    }

    findPath(startX, startY, endX, endY) {
        // Basic A* or similar pathfinding algorithm would go here.
        // For simplicity, let's use a direct step if possible, or a very naive search.
        // This needs a proper implementation for robust movement.
        // The goal is to find an adjacent, non-occupied tile to the target.
        const openSet = [];
        const closedSet = [];
        const cameFrom = new Map();
        const gScore = new Map(); // Cost from start to current
        const fScore = new Map(); // Estimated total cost from start to goal through current

        const startNode = { x: startX, y: startY, f: 0, g: 0 };
        gScore.set(`${startX},${startY}`, 0);
        fScore.set(`${startX},${startY}`, this.heuristic(startX, startY, endX, endY));
        openSet.push(startNode);

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f); // Find node with lowest fScore
            const current = openSet.shift();

            // If current is adjacent to endX, endY, we found a path to an adjacent spot
            if (Math.abs(current.x - endX) <= 1 && Math.abs(current.y - endY) <= 1 && !(current.x === endX && current.y === endY)) {
                if (!this.scene.buildingSystem.isTileOccupiedByBuilding(current.x, current.y) || (current.x === startX && current.y === startY)){
                    return this.reconstructPath(cameFrom, current);
                }
            }
            
            if (current.x === endX && current.y === endY) { // Should not happen if target is occupied
                 return this.reconstructPath(cameFrom, current); // Path to the target itself
            }

            closedSet.push(`${current.x},${current.y}`);

            this.getNeighbors(current.x, current.y).forEach(neighbor => {
                if (closedSet.includes(`${neighbor.x},${neighbor.y}`)) {
                    return;
                }
                // Allow moving to the target's exact tile only if it's the final destination (handled above)
                // For moveToTarget, we want an adjacent tile, so the target itself is 'occupied' for pathing purposes.
                if (neighbor.x === endX && neighbor.y === endY) { 
                    // We are looking for a spot *next* to the tree, not on it.
                } else if (this.scene.buildingSystem.isTileOccupiedByBuilding(neighbor.x, neighbor.y)) {
                    return; // Skip occupied neighbors
                }

                const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1; // Distance between neighbors is 1

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
        return null; // No path found
    }

    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2); // Manhattan distance
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
        const directions = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}]; // N, S, W, E
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
        if (dy < 0) return this.npc.config.profession === 'Miner' ? 'miner_up' : 'farmer_up';
        if (dy > 0) return this.npc.config.profession === 'Miner' ? 'miner_down' : 'farmer_down';
        if (dx < 0) return this.npc.config.profession === 'Miner' ? 'miner_left' : 'farmer_left';
        if (dx > 0) return this.npc.config.profession === 'Miner' ? 'miner_right' : 'farmer_right';
        return null;
    }

    update() {
        if (this.isWorking && !this.npc.isMoving) {
            // Check if current action is complete, then decide next action
            // This is mostly handled by callbacks in moveToTarget and chopTree
        }
    }
}

