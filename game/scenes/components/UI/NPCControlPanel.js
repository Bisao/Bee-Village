export default class NPCControlPanel {
    constructor(scene) {
        this.scene = scene;
    }

    showNPCControls(npc) {
        this.cleanupNPCControls();

        const modal = document.createElement('div');
        modal.className = 'npc-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-button">✕</button>
                <div class="npc-header">
                    <div class="npc-avatar">
                        ${npc.config.emoji}
                    </div>
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

                <div class="modal-tabs">
                    <button class="modal-tab active" data-tab="inventory">Inventário</button>
                    <button class="modal-tab" data-tab="jobs">Trabalhos</button>
                </div>

                <div class="tab-panel active" id="inventory-panel">
                    <div class="npc-inventory">
                        ${npc.config.tools.map(tool => `
                            <div class="tool-slot">
                                <div class="tool-emoji">${tool.emoji}</div>
                                <div class="tool-name">${tool.name}</div>
                                <div class="tool-description">${tool.description}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="storage-grid">
                        ${Array(4).fill().map((_, i) => `
                            <div class="storage-slot">
                                <div class="storage-icon">${this.getProfessionIcon(npc.config.profession)}</div>
                                <div class="storage-amount">${i < (npc.inventory[this.getProfessionResource(npc.config.profession)] || 0) ? '1' : '0'}/1</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tab-panel" id="jobs-panel">
                    <div class="jobs-list">
                        ${this.getAvailableJobs(npc).map(job => `
                            <div class="job-option ${npc.currentJob === job.id ? 'active' : ''}" data-job="${job.id}">
                                <div class="job-icon">${job.icon}</div>
                                <div class="job-info">
                                    <div class="job-name">${job.name}</div>
                                    <div class="job-description">${job.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        this.setupEventHandlers(modal, npc);
    }

    setupEventHandlers(modal, npc) {
        modal.querySelectorAll('.job-option').forEach(option => {
            option.addEventListener('click', () => {
                const jobId = option.dataset.job;
                this.handleJobSelection(jobId, npc);
                modal.remove();
            });
        });

        modal.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => this.handleTabSwitch(modal, tab));
        });

        modal.querySelector('#autonomous').onclick = () => this.handleAutonomousMode(npc, modal);
        modal.querySelector('#controlled').onclick = () => this.handleControlledMode(npc, modal);
        modal.querySelector('.close-button').onclick = () => modal.remove();
        modal.querySelector('.camera-follow-btn').onclick = () => this.handleCameraFollow(npc, modal);

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    getProfessionIcon(profession) {
        switch(profession) {
            case 'Lumberjack': return '🌳';
            case 'Farmer': return '🌾';
            case 'Miner': return '⛏️';
            default: return '🐟';
        }
    }

    getProfessionResource(profession) {
        switch(profession) {
            case 'Lumberjack': return 'wood';
            case 'Farmer': return 'wheat';
            case 'Miner': return 'ore';
            default: return 'fish';
        }
    }

    getAvailableJobs(npc) {
        const jobs = [
            { id: 'idle', name: 'Descanso', icon: '☕', description: 'Não faz nada.' }
        ];

        if (npc.config.profession === 'Lumberjack') {
            jobs.push({ 
                id: 'lumber', 
                name: 'Cortar Madeira', 
                icon: '🪓', 
                description: 'Corta árvores e coleta madeira.' 
            });
        }

        if (npc.config.profession === 'Miner') {
            jobs.push({
                id: 'mine',
                name: 'Minerar',
                icon: '⛏️',
                description: 'Minerar rochas próximas'
            });
        }

        return jobs;
    }

    handleJobSelection(jobId, npc) {
        switch(jobId) {
            case 'lumber':
                if (!npc.lumberSystem) {
                    npc.lumberSystem = new this.scene.LumberSystem(this.scene);
                }
                npc.isAutonomous = false;
                npc.currentJob = 'lumber';
                npc.config.emoji = '🪓';
                npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                npc.lumberSystem.startWorking(npc);
                console.log('Iniciando trabalho de lenhador:', npc.config.name);
                break;
            case 'mine':
                npc.isAutonomous = false;
                npc.currentJob = 'mine';
                npc.config.emoji = '⛏️';
                npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                console.log('Iniciando trabalho de mineração:', npc.config.name);
                break;
        }
    }

    handleTabSwitch(modal, selectedTab) {
        modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        modal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        selectedTab.classList.add('active');
        const tabId = selectedTab.dataset.tab;
        document.getElementById(`${tabId}-panel`).classList.add('active');
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
                if (this.scene.inputManager.isMobile) {
                    document.getElementById('controls-panel').style.display = 'none';
                }
            }
        });
        this.scene.showFeedback(`${npc.config.name} está em modo autônomo`, true);
        modal.remove();
    }

    handleControlledMode(npc, modal) {
        npc.isAutonomous = false;
        this.scene.currentControlledNPC = npc;
        this.scene.cameras.main.startFollow(npc.sprite, true, 0.08, 0.08);
        const controlsPanel = document.getElementById('controls-panel');
        if (this.scene.inputManager.isMobile && controlsPanel) {
            controlsPanel.style.display = 'flex';
            controlsPanel.style.zIndex = '2000';
        }
        modal.remove();
    }

    handleCameraFollow(npc, modal) {
        this.scene.cameras.main.startFollow(npc.sprite, true);
        modal.remove();

        const clickHandler = () => {
            this.scene.cameras.main.stopFollow();
            this.scene.input.off('pointerdown', clickHandler);
        };
        this.scene.input.on('pointerdown', clickHandler);
    }

    cleanupNPCControls() {
        if (this.scene.currentControlledNPC) {
            const previousNPC = this.scene.currentControlledNPC;
            previousNPC.isAutonomous = true;

            if (previousNPC.movementTimer) {
                previousNPC.movementTimer.remove();
            }

            if (previousNPC.controls) {
                Object.values(previousNPC.controls).forEach(key => key.destroy());
                previousNPC.controls = null;
            }
            if (previousNPC.updateHandler) {
                this.scene.events.off('update', previousNPC.updateHandler);
                previousNPC.updateHandler = null;
            }

            this.scene.currentControlledNPC = null;

            this.scene.time.delayedCall(100, () => {});
        }
    }
}