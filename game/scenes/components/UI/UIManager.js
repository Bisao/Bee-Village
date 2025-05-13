export default export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.modals = new Map();
    }

    showNPCControls(npc) {
        this.cleanupNPCControls();
        
        const modal = document.createElement('div');
        modal.className = 'npc-modal';
        modal.innerHTML = this.createNPCModalContent(npc);
        
        document.body.appendChild(modal);
        this.setupNPCModalHandlers(modal, npc);
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
                ${this.createInventoryPanel(npc)}
                ${this.createJobsPanel(npc)}
            </div>`;
    }

    setupNPCModalHandlers(modal, npc) {
        modal.querySelector('.close-button').onclick = () => modal.remove();
        
        modal.querySelector('#autonomous').onclick = () => {
            this.scene.tweens.add({
                targets: this.scene.cameras.main,
                zoom: 1.5,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    npc.isAutonomous = true;
                    this.scene.cameras.main.stopFollow();
                    this.scene.npcManager.startNPCMovement(npc);
                    if (this.scene.inputManager.isMobile) {
                        document.getElementById('controls-panel').style.display = 'none';
                    }
                }
            });
            this.scene.feedbackManager.showFeedback(`${npc.config.name} está em modo autônomo`, true);
            modal.remove();
        };

        modal.querySelector('#controlled').onclick = () => {
            npc.isAutonomous = false;
            this.scene.currentControlledNPC = npc;
            this.scene.cameras.main.startFollow(npc.sprite, true, 0.08, 0.08);
            this.scene.npcManager.enablePlayerControl(npc);
            const controlsPanel = document.getElementById('controls-panel');
            if (this.scene.inputManager.isMobile && controlsPanel) {
                controlsPanel.style.display = 'flex';
                controlsPanel.style.zIndex = '2000';
            }
            modal.remove();
        };

        const cameraButton = modal.querySelector('.camera-follow-btn');
        cameraButton.onclick = () => {
            this.scene.cameras.main.startFollow(npc.sprite, true);
            modal.remove();
        };

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
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
            </div>`;
    }

    createInventoryPanel(npc) {
        const tools = npc.config.tools.map(tool => `
            <div class="tool-slot">
                <div class="tool-emoji">${tool.emoji}</div>
                <div class="tool-name">${tool.name}</div>
                <div class="tool-description">${tool.description}</div>
            </div>
        `).join('');

        return `
            <div class="tab-panel active" id="inventory-panel">
                <div class="npc-inventory">
                    ${tools}
                </div>
                <div class="storage-grid">
                    ${Array(4).fill().map((_, i) => `
                        <div class="storage-slot">
                            <div class="storage-icon">${this.getProfessionIcon(npc.config.profession)}</div>
                            <div class="storage-amount">${i < (npc.inventory[this.getProfessionResource(npc.config.profession)] || 0) ? '1' : '0'}/1</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
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

    createJobsPanel(npc) {
        const jobs = this.getAvailableJobs(npc);
        return `
            <div class="tab-panel" id="jobs-panel">
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
            </div>`;
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

        return jobs;
    }

    showSiloModal(resources) {
        const existingModal = document.querySelector('.silo-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'silo-modal';
        modal.innerHTML = `
            <div class="silo-content">
                <div class="silo-header">
                    <h2 class="silo-title">🏗️ Armazém de Recursos</h2>
                    <button class="close-button">✕</button>
                </div>
                <div class="resources-grid">
                    <div class="resource-category">
                        <h3>🪓 Recursos de Madeira</h3>
                        <div class="resource-item">
                            <div class="resource-icon">🌳</div>
                            <div class="resource-info">
                                <div class="resource-name">Toras de Madeira</div>
                                <div class="resource-amount">${resources.find(r => r.name === 'Madeira')?.amount || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.find(r => r.name === 'Madeira')?.amount || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="resource-category">
                        <h3>🌾 Recursos Agrícolas</h3>
                        <div class="resource-item">
                            <div class="resource-icon">🌾</div>
                            <div class="resource-info">
                                <div class="resource-name">Trigo</div>
                                <div class="resource-amount">${resources.find(r => r.name === 'Trigo')?.amount || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.find(r => r.name === 'Trigo')?.amount || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="resource-category">
                        <h3>⛏️ Recursos Minerais</h3>
                        <div class="resource-item">
                            <div class="resource-icon">⛏️</div>
                            <div class="resource-info">
                                <div class="resource-name">Minério</div>
                                <div class="resource-amount">${resources.find(r => r.name === 'Minério')?.amount || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.find(r => r.name === 'Minério')?.amount || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    setupUIHandlers() {
        const buttons = document.querySelectorAll('.building-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.scene.selectedBuilding = btn.dataset.building;
                if (this.scene.previewBuilding) {
                    this.scene.previewBuilding.destroy();
                    this.scene.previewBuilding = null;
                }
                document.getElementById('side-panel').style.display = 'none';
            });
        });

        const toggleButton = document.getElementById('toggleStructures');
        const sidePanel = document.getElementById('side-panel');

        if (toggleButton && sidePanel) {
            toggleButton.addEventListener('click', () => {
                const isVisible = sidePanel.style.display === 'flex';
                sidePanel.style.display = isVisible ? 'none' : 'flex';
                if (!isVisible) {
                    this.scene.clearBuildingSelection();
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
                fontSize: '16px',
                fill: success ? '#4CAF50' : '#f44336',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 20,
            duration: 5000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }
}