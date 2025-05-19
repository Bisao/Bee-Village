class SettingsManager {
    constructor() {
        this.gameSoundControl = document.getElementById("gameSound");
        this.backgroundMusicControl = document.getElementById("backgroundMusic");
        this.defaultZoomControl = document.getElementById("defaultZoom");

        this.loadAndApplySettings();
        this.initEventListeners();
    }

    initEventListeners() {
        this.gameSoundControl?.addEventListener("input", () => this.handleGameSoundChange());
        this.backgroundMusicControl?.addEventListener("input", () => this.handleBackgroundMusicChange());
        this.defaultZoomControl?.addEventListener("input", () => this.handleDefaultZoomChange());
    }

    loadAndApplySettings() {
        const settings = this.loadSettings();
        if (this.gameSoundControl) this.gameSoundControl.value = settings.gameSound;
        if (this.backgroundMusicControl) this.backgroundMusicControl.value = settings.backgroundMusic;
        if (this.defaultZoomControl) this.defaultZoomControl.value = settings.defaultZoom;

        // Apply initial settings to the game instance if available
        this.updateGameSound(settings.gameSound);
        this.updateBackgroundMusic(settings.backgroundMusic);
        this.updateDefaultZoom(settings.defaultZoom);
    }

    loadSettings() {
        const defaultSettings = {
            gameSound: 50,
            backgroundMusic: 50,
            defaultZoom: 100
        };
        const savedSettings = localStorage.getItem("gameSettings");
        try {
            return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
        } catch (e) {
            console.error("Error parsing saved settings:", e);
            return defaultSettings;
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem("gameSettings", JSON.stringify(settings));
        } catch (e) {
            console.error("Error saving settings:", e);
        }
    }

    handleGameSoundChange() {
        const value = this.gameSoundControl.value;
        this.saveSettings({ ...this.loadSettings(), gameSound: value });
        this.updateGameSound(value);
    }

    updateGameSound(value) {
        if (window.game && window.game.sound) {
            const volume = parseInt(value, 10) / 100;
            window.game.sound.volume = volume;
        }
    }

    handleBackgroundMusicChange() {
        const value = this.backgroundMusicControl.value;
        this.saveSettings({ ...this.loadSettings(), backgroundMusic: value });
        this.updateBackgroundMusic(value);
    }

    updateBackgroundMusic(value) {
        if (window.game) {
            const volume = parseInt(value, 10) / 100;
            // Assuming background music might be managed differently, e.g., a specific sound object
            if (window.game.backgroundMusic && typeof window.game.backgroundMusic.setVolume === "function") {
                window.game.backgroundMusic.setVolume(volume);
            } else if (window.game.sound && window.game.sound.get("backgroundMusic")) {
                 window.game.sound.get("backgroundMusic").volume = volume;
            }
        }
    }

    handleDefaultZoomChange() {
        const value = this.defaultZoomControl.value;
        this.saveSettings({ ...this.loadSettings(), defaultZoom: value });
        this.updateDefaultZoom(value);
    }

    updateDefaultZoom(value) {
        // Ensure game and scenes are loaded before trying to set zoom
        if (window.game && window.game.scene && window.game.scene.scenes.length > 0) {
            const mainScene = window.game.scene.getScene("MainScene") || window.game.scene.getScene("GameScene") || window.game.scene.scenes[0];
            if (mainScene && mainScene.cameras && mainScene.cameras.main) {
                const zoom = parseInt(value, 10) / 100;
                mainScene.cameras.main.setZoom(zoom);
            }
        }
    }
}

// Initialize the SettingsManager when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.settingsManager = new SettingsManager();
});

