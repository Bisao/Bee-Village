class UIManager {
    constructor() {
        this.startScreen = document.getElementById("start-screen");
        this.settingsButton = document.getElementById("settings-button");
        this.settingsPanel = document.getElementById("settings-panel");
        this.backButton = document.querySelector("#settings-panel .back-button");
        this.tabButtons = document.querySelectorAll(".tab-btn");
        this.structuresToggleButton = document.getElementById("toggleStructures"); // Este botão é criado pelo Phaser
        this.sidePanel = document.getElementById("side-panel");
        this.playButton = document.getElementById("play-button");
        this.fullscreenButton = document.getElementById("fullscreen-button");

        console.log("UIManager: Constructor called.");
        if (this.settingsButton) {
            console.log("UIManager: settingsButton found.");
        } else {
            console.error("UIManager: settingsButton NOT found.");
        }
        if (this.settingsPanel) {
            console.log("UIManager: settingsPanel found.");
        } else {
            console.error("UIManager: settingsPanel NOT found.");
        }
        if (this.structuresToggleButton) {
            console.log("UIManager: structuresToggleButton FOUND in constructor. Listener will be attached if element exists now.");
        } else {
            console.warn("UIManager: structuresToggleButton NOT FOUND in constructor. This is expected if Phaser creates it later. GameScene should handle its click.");
        }
        if (!this.sidePanel) {
            console.error("UIManager: sidePanel NOT found!");
        }


        this.initEventListeners();
    }

    initEventListeners() {
        console.log("UIManager: Initializing event listeners.");
        this.settingsButton?.addEventListener("click", () => {
            console.log("UIManager: Settings button clicked.");
            this.showSettingsPanel();
        });
        this.backButton?.addEventListener("click", () => this.hideSettingsPanel());
        this.tabButtons.forEach(button => {
            button.addEventListener("click", () => this.handleTabSwitch(button));
        });
        
        // O listener para structuresToggleButton é problemático aqui se o botão ainda não existe.
        // A GameScene já está configurada para chamar toggleSidePanel via evento do jogo.
        // this.structuresToggleButton?.addEventListener("click", () => this.toggleSidePanel()); 
        // Se o botão for encontrado aqui, este listener pode causar comportamento duplo ou inesperado.
        // Por enquanto, vamos confiar no evento da GameScene.
    }

    showSettingsPanel() {
        console.log("UIManager: showSettingsPanel called.");
        if (this.settingsPanel) {
            console.log("UIManager: Attempting to show settings panel.");
            this.settingsPanel.style.display = "flex";
            this.settingsPanel.classList.add("visible");
            console.log("UIManager: settingsPanel display set to flex and class 'visible' added.");
        } else {
            console.error("UIManager: settingsPanel is null in showSettingsPanel.");
        }
    }

    hideSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.classList.remove("visible");
            setTimeout(() => {
                if (this.settingsPanel) this.settingsPanel.style.display = "none";
            }, 300);
        }
    }

    handleTabSwitch(clickedButton) {
        if (!clickedButton || clickedButton.disabled) return;
        document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
        clickedButton.classList.add("active");
        const tabId = `${clickedButton.dataset.tab}-tab`;
        const activeTabContent = document.getElementById(tabId);
        if (activeTabContent) {
            activeTabContent.classList.add("active");
        }
    }

    toggleSidePanel() {
        console.log("UIManager: toggleSidePanel method called.");
        if (this.sidePanel) {
            const computedDisplay = window.getComputedStyle(this.sidePanel).display;
            console.log(`UIManager: sidePanel computed display is '${computedDisplay}'`);

            if (computedDisplay === "none") {
                console.log("UIManager: sidePanel is hidden (computed), attempting to show.");
                this.sidePanel.style.display = "flex";
            } else {
                console.log("UIManager: sidePanel is visible (computed), attempting to hide.");
                this.sidePanel.style.display = "none";
            }
            console.log(`UIManager: sidePanel new inline display is '${this.sidePanel.style.display}'`);
        } else {
            console.error("UIManager: this.sidePanel is null in toggleSidePanel. Cannot toggle.");
        }
    }

    showFeedback(message, duration = 2000) {
        const feedback = document.createElement("div");
        feedback.className = "feedback-message";
        feedback.textContent = message;
        document.body.appendChild(feedback);
        requestAnimationFrame(() => {
            feedback.classList.add("visible");
            setTimeout(() => {
                feedback.classList.remove("visible");
                setTimeout(() => feedback.remove(), 300);
            }, duration);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("UIManager: DOMContentLoaded event fired. Initializing UIManager.");
    window.uiManager = new UIManager();
});

