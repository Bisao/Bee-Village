
export const GameConfig = {
    grid: {
        width: 10,
        height: 10,
        tileSize: 64
    },
    camera: {
        initialZoom: {
            desktop: 1.5,
            mobile: 0.8
        },
        zoomLimits: {
            min: 0.5,
            max: 2.0
        }
    },
    buildings: {
        scale: 1.4,
        types: ['farmerHouse', 'cowHouse', 'chickenHouse', 'pigHouse', 'minerHouse', 'fishermanHouse']
    },
    npcs: {
        movementSpeed: 600,
        scale: 0.8
    },
    autosave: {
        interval: 60000, // 1 minute
        maxBackups: 3
    }
};

export default GameConfig;
