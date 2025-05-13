export default class NPCControlPanel {
    constructor(scene) {
        this.scene = scene;
        this.activeModals = new Set();
    }

    show(npc) {
        this.cleanupExistingModals();

        const modal = this.createModal();
        modal.innerHTML = this.getModalHTML(npc);
        document.body.appendChild(modal);

        this.setupEventListeners(modal, npc);
        this.activeModals.add(modal);
    }

    cleanupExistingModals() {
        const existingModals = document.querySelectorAll(
            ".npc-modal, .silo-modal",
        );
        existingModals.forEach((modal) => modal.remove());
    }

    createModal() {
        const modal = document.createElement("div");
        modal.className = "npc-modal";
        return modal;
    }

    getModalHTML(npc) {
        return `
            <div class="modal-content dark-panel">
                ${this.getHeaderHTML(npc)}
                ${this.getControlButtonsHTML(npc)}
                ${this.getTabsHTML()}
                ${this.getPanelsHTML(npc)}
            </div>
        `;
    }

    getHeaderHTML(npc) {
        return `
            <button class="close-button">✕</button>
            <div class="npc-header">
                <div class="npc-avatar">${npc.config.emoji}</div>
                <div class="npc-info">
                    <div class="npc-name-row">
                        <h3>${npc.config.name}</h3>
                        <button class="camera-follow-btn">👁️ Seguir</button>
                    </div>
                    <p class="npc-profession">${npc.config.profession}</p>
                    <div class="npc-level-info">
                        <span class="level-text">Nível ${npc.config.level}</span>
                        <div class="xp-bar">
                            <div class="xp-progress" style="width: ${(npc.config.xp / npc.config.maxXp) * 100}%"></div>
                        </div>
                        <span class="xp-text">${npc.config.xp}/${npc.config.maxXp} XP</span>
                    </div>
                </div>
            </div>
        `;
    }

    getControlButtonsHTML(npc) {
        return `
            <div class="control-buttons">
                <button class="control-btn ${npc.isAutonomous ? "active" : ""}" id="autonomous">
                    🤖 Modo Autônomo
                </button>
                <button class="control-btn ${!npc.isAutonomous ? "active" : ""}" id="controlled">
                    🕹️ Modo Controlado
                </button>
            </div>
            `;
    }

    getTabsHTML() {
        return `
            <div class="modal-tabs">
                <button class="modal-tab active" data-tab="inventory">Inventário</button>
                <button class="modal-tab" data-tab="jobs">Trabalhos</button>
            </div>
        `;
    }

    getPanelsHTML(npc) {
        return `
            <div class="tab-panel active" id="inventory-panel">
                ${this.getInventoryHTML(npc)}
            </div>
            <div class="tab-panel" id="jobs-panel">
                ${this.getJobsHTML(npc)}
            </div>
        `;
    }

    getInventoryHTML(npc) {
        return `
            <div class="npc-inventory">
                ${npc.config.tools
                    .map(
                        (tool) => `
                    <div class="tool-slot">
                        <div class="tool-emoji">${tool.emoji}</div>
                        <div class="tool-name">${tool.name}</div>
                        <div class="tool-description">${tool.description}</div>
                    </div>
                `,
                    )
                    .join("")}
            </div>
            <div class="storage-grid">
                ${Array(4)
                    .fill()
                    .map(
                        (_, i) => `
                    <div class="storage-slot">
                        <div class="storage-icon">${this.getStorageIcon(npc)}</div>
                        <div class="storage-amount">${this.getStorageAmount(npc, i)}/1</div>
                    </div>
                `,
                    )
                    .join("")}
            </div>
        `;
    }

    getStorageIcon(npc) {
        const icons = {
            Lumberjack: "🌳",
            Farmer: "🌾",
            Miner: "⛏️",
            Fisher: "🐟",
        };
        return icons[npc.config.profession] || "📦";
    }

    getStorageAmount(npc, index) {
        const resourceTypes = {
            Lumberjack: "wood",
            Farmer: "wheat",
            Miner: "ore",
            Fisher: "fish",
        };
        const resourceType = resourceTypes[npc.config.profession];
        return index < (npc.inventory[resourceType] || 0) ? "1" : "0";
    }

    getJobsHTML(npc) {
        const jobs = this.scene.getAvailableJobs(npc);
        return `
            <div class="jobs-list">
                ${jobs
                    .map(
                        (job) => `
                    <div class="job-option ${npc.currentJob === job.id ? "active" : ""}" data-job="${job.id}">
                        <div class="job-icon">${job.icon}</div>
                        <div class="job-info">
                            <div class="job-name">${job.name}</div>
                            <div class="job-description">${job.description}</div>
                        </div>
                    </div>
                `,
                    )
                    .join("")}
            </div>
        `;
    }

    setupEventListeners(modal, npc) {
        this.setupCloseHandlers(modal);
        this.setupTabHandlers(modal);
        this.setupJobHandlers(modal, npc);
        this.setupControlHandlers(modal, npc);
        this.setupCameraHandlers(modal, npc);
    }

    setupCloseHandlers(modal) {
        const closeButton = modal.querySelector(".close-button");
        closeButton.onclick = () => this.closeModal(modal);
        modal.onclick = (e) => {
            if (e.target === modal) this.closeModal(modal);
        };
    }

    setupTabHandlers(modal) {
        modal.querySelectorAll(".modal-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                modal
                    .querySelectorAll(".modal-tab")
                    .forEach((t) => t.classList.remove("active"));
                modal
                    .querySelectorAll(".tab-panel")
                    .forEach((p) => p.classList.remove("active"));
                tab.classList.add("active");
                const panel = modal.querySelector(`#${tab.dataset.tab}-panel`);
                if (panel) panel.classList.add("active");
            });
        });
    }

    setupJobHandlers(modal, npc) {
        modal.querySelectorAll(".job-option").forEach((option) => {
            option.addEventListener("click", () => {
                const jobId = option.dataset.job;
                this.handleJobSelection(npc, jobId);
                this.closeModal(modal);
            });
        });
    }

    setupControlHandlers(modal, npc) {
        modal.querySelector("#autonomous").onclick = () => {
            this.enableAutonomousMode(npc);
            this.closeModal(modal);
        };

        modal.querySelector("#controlled").onclick = () => {
            this.enableControlledMode(npc);
            this.closeModal(modal);
        };
    }

    setupCameraHandlers(modal, npc) {
        const cameraButton = modal.querySelector(".camera-follow-btn");
        cameraButton.onclick = () => {
            this.scene.cameras.main.startFollow(npc.sprite, true);
            this.closeModal(modal);

            const clickHandler = () => {
                this.scene.cameras.main.stopFollow();
                this.scene.input.off("pointerdown", clickHandler);
            };
            this.scene.input.on("pointerdown", clickHandler);
        };
    }

    handleJobSelection(npc, jobId) {
        if (jobId === "lumber" && npc.config.profession === "Lumberjack") {
            if (!npc.lumberSystem) {
                npc.lumberSystem = new this.scene.LumberSystem(this.scene);
            }
            npc.isAutonomous = false;
            npc.currentJob = "lumber";
            npc.config.emoji = "🪓";
            npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
            npc.lumberSystem.startWorking(npc);
        } else if (jobId === "mine" && npc.config.profession === "Miner") {
            if (!npc.mineSystem) {
                npc.mineSystem = new this.scene.MineSystem(this.scene);
            }
            npc.isAutonomous = true;
            npc.currentJob = "mine";
            npc.config.emoji = "⛏️";
            npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
            npc.mineSystem.startWorking(npc);
        } else if (jobId === "idle") {
            npc.isAutonomous = true;
            npc.currentJob = "idle";
            this.scene.startNPCMovement(npc);
        }
    }

    enableAutonomousMode(npc) {
        this.scene.tweens.add({
            targets: this.scene.cameras.main,
            zoom: 1.5,
            duration: 500,
            ease: "Power2",
            onComplete: () => {
                npc.isAutonomous = true;
                this.scene.cameras.main.stopFollow();
                this.scene.startNPCMovement(npc);
                if (this.scene.inputManager.isMobile) {
                    document.getElementById("controls-panel").style.display =
                        "none";
                }
            },
        });
        this.scene.showFeedback(
            `${npc.config.name} está em modo autônomo`,
            true,
        );
    }

    enableControlledMode(npc) {
        npc.isAutonomous = false;
        this.scene.currentControlledNPC = npc;
        this.scene.cameras.main.startFollow(npc.sprite, true, 0.08, 0.08);
        this.scene.enablePlayerControl(npc);

        const controlsPanel = document.getElementById("controls-panel");
        if (this.scene.inputManager.isMobile && controlsPanel) {
            controlsPanel.style.display = "flex";
            controlsPanel.style.zIndex = "2000";
        }
    }

    closeModal(modal) {
        modal.remove();
        this.activeModals.delete(modal);
    }

    showSiloModal(resources) {
        this.cleanupExistingModals();

        const modal = document.createElement("div");
        modal.className = "silo-modal";
        modal.innerHTML = this.getSiloModalHTML(resources);

        document.body.appendChild(modal);
        this.setupSiloModalHandlers(modal);
        this.activeModals.add(modal);
    }

    getSiloModalHTML(resources) {
        return `
            <div class="silo-content">
                ${this.getSiloHeaderHTML()}
                ${this.getSiloResourcesHTML(resources)}
            </div>
        `;
    }

    getSiloHeaderHTML() {
        return `
            <div class="silo-header">
                <h2 class="silo-title">🏗️ Armazém de Recursos</h2>
                <button class="close-button">✕</button>
            </div>
        `;
    }

    getSiloResourcesHTML(resources) {
        return `
            <div class="resources-grid">
                ${this.getResourceCategoryHTML("🪓 Recursos de Madeira", "Madeira", "🌳", resources)}
                ${this.getResourceCategoryHTML("🌾 Recursos Agrícolas", "Trigo", "🌾", resources)}
                ${this.getResourceCategoryHTML("⛏️ Recursos Minerais", "Minério", "⛏️", resources)}
            </div>
        `;
    }

    getResourceCategoryHTML(title, resourceName, icon, resources) {
        const resource = resources.find((r) => r.name === resourceName);
        const amount = resource?.amount || 0;
        const percentage = (amount / 100) * 100;

        return `
            <div class="resource-category">
                <h3>${title}</h3>
                <div class="resource-item">
                    <div class="resource-icon">${icon}</div>
                    <div class="resource-info">
                        <div class="resource-name">${resourceName}</div>
                        <div class="resource-amount">${amount}</div>
                    </div>
                    <div class="resource-progress">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    setupSiloModalHandlers(modal) {
        const closeButton = modal.querySelector(".close-button");
        closeButton.onclick = () => this.closeModal(modal);
    }
}
