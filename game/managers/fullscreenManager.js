class FullscreenManager {
    constructor() {
        this.fullscreenButton = document.getElementById("fullscreen-button");
        this.playButton = document.getElementById("play-button"); // Play button also triggers fullscreen

        this.initEventListeners();
    }

    initEventListeners() {
        this.fullscreenButton?.addEventListener("click", () => this.toggleFullScreen());
        this.playButton?.addEventListener("click", () => {
            // Request fullscreen when play is clicked, then proceed with play logic (handled elsewhere)
            this.requestFullScreen();
            // The actual game start logic should be triggered by the game's main script or Phaser scene manager
        });
    }

    requestFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }

    exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => {
                console.warn(`Error attempting to disable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }

    toggleFullScreen() {
        if (!document.fullscreenElement) {
            this.requestFullScreen();
        } else {
            this.exitFullScreen();
        }
    }
}

// Initialize the FullscreenManager when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.fullscreenManager = new FullscreenManager();
});

