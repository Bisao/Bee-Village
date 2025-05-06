
export const TILE_SIZE = {
    WIDTH: 64,
    HEIGHT: 64
};

export const ZOOM_LIMITS = {
    MIN: 0.5,
    MAX: 2
};

export const BUILDING_TYPES = {
    FARMER_HOUSE: 'farmerHouse',
    MINER_HOUSE: 'minerHouse',
    FISHERMAN_HOUSE: 'fishermanHouse'
};

export const PROFESSION_NAMES = {
    farmerHouse: {
        prefix: 'Farmer',
        names: ['John', 'Peter', 'Mary', 'Lucas', 'Emma', 'Sofia', 'Miguel', 'Julia']
    },
    fishermanHouse: {
        prefix: 'Fisher',
        names: ['Jack', 'Tom', 'Nina', 'Marco', 'Ana', 'Leo', 'Luna', 'Kai']
    },
    minerHouse: {
        prefix: 'Miner',
        names: ['Max', 'Sam', 'Alex', 'Cole', 'Ruby', 'Jade', 'Rocky', 'Crystal']
    }
};
