export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.initializeUI();
    }

    initializeUI() {
        this.setupUIHandlers();
    }

    setupUIHandlers() {
        this.setupBuildButtons();
        this.setupSaveButtons();
    }

    setupBuildButtons() {
        const buildButtons = document.querySelectorAll('.build-button');
        buildButtons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.dataset.building;
                this.scene.buildingManager.selectBuilding(buildingType);
            });
        });
    }

    setupSaveButtons() {
        const saveButton = document.querySelector('.save-button');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.scene.saveManager.autoSave();
            });
        }

        const clearSaveButton = document.querySelector('.clear-save-button');
        if (clearSaveButton) {
            clearSaveButton.addEventListener('click', () => {
                localStorage.removeItem('gameState');
                console.log('Save cleared');
            });
        }
    }

    showSiloModal(resources) {
        const existingModal = document.querySelector('.silo-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'silo-modal';
        modal.innerHTML = this.createSiloModalContent(resources);
        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => modal.remove();
    }

    createSiloModalContent(resources) {
        return `
            <div class="silo-content">
                <div class="silo-header">
                    <h2 class="silo-title">🏗️ Armazém de Recursos</h2>
                    <button class="close-button">✕</button>
                </div>
                <div class="resources-grid">
                    ${this.createResourceCategories(resources)}
                </div>
            </div>
        `;
    }

    createResourceCategories(resources) {
        const categories = [
            {
                icon: '🪓',
                title: 'Recursos de Madeira',
                resourceName: 'Madeira',
                resourceIcon: '🌳'
            },
            {
                icon: '🌾',
                title: 'Recursos Agrícolas',
                resourceName: 'Trigo',
                resourceIcon: '🌾'
            },
            {
                icon: '⛏️',
                title: 'Recursos Minerais',
                resourceName: 'Minério',
                resourceIcon: '⛏️'
            }
        ];

        return categories.map(category => {
            const amount = resources.find(r => r.name === category.resourceName)?.amount || 0;
            const progress = (amount / 100) * 100;

            return `
                <div class="resource-category">
                    <h3>${category.icon} ${category.title}</h3>
                    <div class="resource-item">
                        <div class="resource-icon">${category.resourceIcon}</div>
                        <div class="resource-info">
                            <div class="resource-name">${category.resourceName}</div>
                            <div class="resource-amount">${amount}</div>
                        </div>
                        <div class="resource-progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showFeedback(text, isGood) {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback');
        feedbackElement.textContent = text;
        feedbackElement.classList.add(isGood ? 'good' : 'bad');
        document.body.appendChild(feedbackElement);
        setTimeout(() => feedbackElement.remove(), 3000);
    }

    showNPCControls(npc) {
        this.cleanupNPCControls();
        const modal = document.createElement('div');
        modal.className = 'npc-modal';
        modal.innerHTML = this.createNPCModalContent(npc);
        document.body.appendChild(modal);
        this.setupNPCModalEventHandlers(modal, npc);
    }

    createNPCModalContent(npc) {
        return `
            <div class="modal-content">
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
                ${this.createControlButtons(npc)}
                ${this.createModePanels(npc)}
            </div>
        `;
    }

    createControlButtons(npc) {
        return `
            <div class="control-buttons">
                <button class="control-btn ${npc.isAutonomous ? 'active' : ''}" id="autonomous">
                    🤖 Modo Autônomo
                </button>
                <button class="control-btn ${!npc.isAutonomous ? 'active' : ''}" id="controlled">
                    🕹️ Modo Controlado
                </button>
            </div>
            <div class="mode-info">
                <p class="autonomous-info ${npc.isAutonomous ? 'visible' : ''}">
                    🔄 NPC se move livremente
                </p>
                <p class="controlled-info ${!npc.isAutonomous ? 'visible' : ''}">
                    📱 Use WASD ou controles mobile
                </p>
            </div>
        `;
    }

    createModePanels(npc) {
        return `
            <div class="modal-tabs">
                <button class="modal-tab active" data-tab="inventory">Inventário</button>
                <button class="modal-tab" data-tab="jobs">Trabalhos</button>
            </div>
            <div class="tab-panel active" id="inventory-panel">
                ${this.createInventoryPanel(npc)}
            </div>
            <div class="tab-panel" id="jobs-panel">
                ${this.createJobsPanel(npc)}
            </div>
        `;
    }

    createInventoryPanel(npc) {
        const tools = npc.config.tools.map(tool => `
            <div class="tool-slot">
                <div class="tool-emoji">${tool.emoji}</div>
                <div class="tool-name">${tool.name}</div>
                <div class="tool-description">${tool.description}</div>
            </div>
        `).join('');

        const storage = Array(4).fill().map((_, i) => `
            <div class="storage-slot">
                <div class="storage-icon">${this.getProfessionIcon(npc.config.profession)}</div>
                <div class="storage-amount">${i < (npc.inventory[this.getProfessionResource(npc.config.profession)] || 0) ? '1' : '0'}/1</div>
            </div>
        `).join('');

        return `
            <div class="npc-inventory">${tools}</div>
            <div class="storage-grid">${storage}</div>
        `;
    }

    createJobsPanel(npc) {
        const jobs = this.scene.getAvailableJobs(npc);
        return `
            <div class="jobs-list">
                ${jobs.map(job => `
                    <div class="job-option ${npc.currentJob === job.id ? 'active' : ''}" data-job="${job.id}">
                        <div class="job-icon">${job.icon}</div>
                        <div class="job-info">
                            <div class="job-name">${job.name}</div>
                            <div class="job-description">${job.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getProfessionIcon(profession) {
        const icons = {
            'Lumberjack': '🌳',
            'Farmer': '🌾',
            'Miner': '⛏️',
            'Fisher': '🐟'
        };
        return icons[profession] || '👤';
    }

    getProfessionResource(profession) {
        const resources = {
            'Lumberjack': 'wood',
            'Farmer': 'wheat',
            'Miner': 'ore',
            'Fisher': 'fish'
        };
        return resources[profession] || '';
    }

    setupNPCModalEventHandlers(modal, npc) {
        modal.querySelector('.close-button').onclick = () => modal.remove();

        modal.querySelector('.camera-follow-btn').onclick = () => {
            this.scene.cameras.main.startFollow(npc.sprite, true);
            modal.remove();

            const clickHandler = () => {
                this.scene.cameras.main.stopFollow();
                this.scene.input.off('pointerdown', clickHandler);
            };
            this.scene.input.on('pointerdown', clickHandler);
        };

        modal.querySelector('#autonomous').onclick = () => {
            this.handleAutonomousMode(npc, modal);
        };

        modal.querySelector('#controlled').onclick = () => {
            this.handleControlledMode(npc, modal);
        };

        modal.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                modal.querySelector(`#${tab.dataset.tab}-panel`).classList.add('active');
            });
        });

        modal.querySelectorAll('.job-option').forEach(option => {
            option.addEventListener('click', () => {
                this.handleJobSelection(option.dataset.job, npc, modal);
            });
        });

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    handleAutonomousMode(npc, modal) {
        this.scene.tweens.add({
            targets: this.scene.cameras.main,
            zoom: 1.5,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                npc.isAutonomous = true;
                this.scene.cameras.main.stopFollow();
                this.scene.startNPCMovement(npc);
                if (this.scene.inputManager.isMobile) {
                    document.getElementById('controls-panel').style.display = 'none';
                }
            }
        });
        this.showFeedback(`${npc.config.name} está em modo autônomo`, true);
        modal.remove();
    }

    handleControlledMode(npc, modal) {
        npc.isAutonomous = false;
        this.scene.currentControlledNPC = npc;
        this.scene.cameras.main.startFollow(npc.sprite, true, 0.08, 0.08);
        this.scene.enablePlayerControl(npc);
        const controlsPanel = document.getElementById('controls-panel');
        if (this.scene.inputManager.isMobile && controlsPanel) {
            controlsPanel.style.display = 'flex';
            controlsPanel.style.zIndex = '2000';
        }
        modal.remove();
    }

    handleJobSelection(jobId, npc, modal) {
        if (jobId === 'lumber') {
            if (!npc.lumberSystem) {
                npc.lumberSystem = new LumberSystem(this.scene);
            }
            npc.isAutonomous = false;
            npc.currentJob = 'lumber';
            npc.config.emoji = '🪓';
            npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
            npc.lumberSystem.startWorking(npc);
            modal.remove();
            console.log('Iniciando trabalho de lenhador:', npc.config.name);
        }
    }

    cleanupNPCControls() {
        const existingModal = document.querySelector('.npc-modal');
        if (existingModal) {
            existingModal.remove();
        }
    }
}