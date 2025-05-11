
# Bee Village Game Documentation

## Architecture
- `game/scenes`: Game scenes and core gameplay
- `game/services`: Service layer for game functionality
- `game/components`: Reusable UI and game components

## Key Systems
- Grid System: Manages the game's tile-based world
- Building System: Handles structure placement and management
- NPC System: Controls AI behavior and pathfinding
- Save System: Manages game state persistence

## Development Guidelines
1. Use services for business logic
2. Keep scenes focused on visualization/interaction
3. Follow the validation pattern for user inputs
4. Implement error handling for critical operations

## Testing
Run tests with: `npm test`
Add new tests in: `test/` directory
