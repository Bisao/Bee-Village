export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.selectedBuilding = null; // Managed by BuildingSystem, but UI might need to know
        this.previewBuilding = null;  // Managed by BuildingSystem
    }

    init() {
        this.setupUIHandlers();
        // Import e inicializa o UIController (se ainda for uma entidade separada e externa)
        // Se UIController.js for parte deste UIManager, sua lógica de inicialização viria aqui.
        // Por ora, vamos assumir que o UIController.js original é o que está sendo importado dinamicamente na MainScene.
        // Se a ideia é internalizar, o código de UIController.js seria mesclado aqui.
    }

    setupUIHandlers() {
        const buttons = document.querySelectorAll(".building-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                // Notificar o BuildingSystem sobre a seleção
                if (this.scene.buildingSystem) {
                    this.scene.buildingSystem.setSelectedBuilding(btn.dataset.building);
                }
                // Hide panel when structure is selected
                const sidePanel = document.getElementById("side-panel");
                if (sidePanel) {
                    sidePanel.style.display = "none";
                }
            });
        });

        const toggleButton = document.getElementById("toggleStructures");
        const sidePanel = document.getElementById("side-panel");

        if (toggleButton && sidePanel) {
            toggleButton.addEventListener("click", () => {
                const isVisible = sidePanel.style.display === "flex";
                sidePanel.style.display = isVisible ? "none" : "flex";
                if (!isVisible && this.scene.buildingSystem) {
                    this.scene.buildingSystem.clearBuildingSelection();
                }
            });
        }
    }

    showFeedback(message, success = true) {
        const text = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            message,
            { 
                fontSize: "16px",
                fill: success ? "#4CAF50" : "#f44336",
                backgroundColor: "rgba(0,0,0,0.5)",
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setScrollFactor(0); // Para ficar fixo na câmera

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 20,
            duration: 3000, // Aumentado para melhor visibilidade
            ease: "Power2",
            onComplete: () => text.destroy()
        });
    }

    // Chamado pelo BuildingSystem ou MainScene para limpar a seleção nos botões da UI
    clearBuildingButtonSelection() {
        const buttons = document.querySelectorAll(".building-btn");
        buttons.forEach(b => b.classList.remove("selected"));
    }

    showSiloModal(resources) {
        // Lógica para mostrar o modal do silo (pode ser complexa e envolver HTML/CSS)
        // Exemplo simplificado:
        let message = "Recursos no Silo:\n";
        resources.forEach(r => {
            message += `${r.name}: ${r.amount}\n`;
        });
        alert(message); // Substituir por um modal real
        console.log("Silo Modal Data:", resources);
    }

    // Funções relacionadas ao preview e highlights de tiles podem ser coordenadas com BuildingSystem
    // ou pertencerem primariamente ao BuildingSystem, com o UIManager apenas atualizando a UI se necessário.
}

