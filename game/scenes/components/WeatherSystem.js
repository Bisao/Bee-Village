
export default class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentWeather = 'sunny';
        this.effects = {
            sunny: { growthMultiplier: 1.0 },
            rainy: { growthMultiplier: 1.5 },
            drought: { growthMultiplier: 0.5 }
        };
    }

    setWeather(weather) {
        if (this.effects[weather]) {
            this.currentWeather = weather;
            this.scene.events.emit('weatherChanged', weather);
        }
    }

    getGrowthMultiplier() {
        return this.effects[this.currentWeather].growthMultiplier;
    }
}
