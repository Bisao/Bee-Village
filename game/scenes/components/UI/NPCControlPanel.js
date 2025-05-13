
export default class NPCControlPanel {
    constructor(scene) {
        this.scene = scene;
    }

    show(npc) {
        const existingPanel = document.querySelector('.npc-modal');
        if (existingPanel) existingPanel.remove();

        const modal = document.createElement('div');
        modal.className = 'npc-modal';
        modal.innerHTML = `
            <div class="modal-content dark-panel">
                <button class="close-button">✕</button>
                <div class="npc-header">
                    <div class="npc-avatar">
                        ${npc.config.emoji}
                    </div>
                    <div class="npc-info">
                        <h2>${npc.config.name}</h2>
                        <div class="npc-profession">${npc.config.profession}</div>
                        <div class="npc-level">
                            <span>Nível ${npc.config.level}</span>
                            <div class="xp-bar">
                                <div class="xp-fill" style="width: ${(npc.config.xp / npc.config.maxXp) * 100}%"></div>
                            </div>
                            <span class="xp-text">${npc.config.xp}/${npc.config.maxXp} XP</span>
                        </div>
                    </div>
                </div>

                <div class="panel-tabs">
                    <button class="tab-btn active" data-tab="inventory">Inventário</button>
                    <button class="tab-btn" data-tab="jobs">Trabalhos</button>
                </div>

                <div class="panel-content">
                    <div class="tab-panel active" id="inventory-panel">
                        <div class="inventory-grid">
                            ${this.renderInventory(npc)}
                        </div>
                    </div>
                    <div class="tab-panel" id="jobs-panel">
                        <div class="jobs-list">
                            ${this.renderJobs(npc)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupEventListeners(modal, npc);
    }

    renderInventory(npc) {
        return `
            <div class="tools-section">
                ${npc.config.tools.map(tool => `
                    <div class="tool-slot">
                        <div class="tool-icon">${tool.emoji}</div>
                        <div class="tool-info">
                            <div class="tool-name">${tool.name}</div>
                            <div class="tool-description">${tool.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderJobs(npc) {
        const jobs = this.getAvailableJobs(npc);
        return jobs.map(job => `
            <div class="job-option ${npc.currentJob === job.id ? 'active' : ''}" data-job="${job.id}">
                <div class="job-icon">${job.icon}</div>
                <div class="job-info">
                    <div class="job-name">${job.name}</div>
                    <div class="job-description">${job.description}</div>
                </div>
            </div>
        `).join('');
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

    setupEventListeners(modal, npc) {
        // Close button
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => modal.remove();

        // Tab switching
        const tabs = modal.querySelectorAll('.tab-btn');
        const panels = modal.querySelectorAll('.tab-panel');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const panel = modal.querySelector(`#${tab.dataset.tab}-panel`);
                if (panel) panel.classList.add('active');
            });
        });

        // Job selection
        modal.querySelectorAll('.job-option').forEach(option => {
            option.addEventListener('click', () => {
                const jobId = option.dataset.job;
                this.handleJobSelection(npc, jobId);
                modal.remove();
            });
        });
    }

    handleJobSelection(npc, jobId) {
        if (jobId === 'lumber' && npc.config.profession === 'Lumberjack') {
            if (!npc.lumberSystem) {
                npc.lumberSystem = new this.scene.LumberSystem(this.scene);
            }
            npc.isAutonomous = false;
            npc.currentJob = 'lumber';
            npc.config.emoji = '🪓';
            npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
            npc.lumberSystem.startWorking(npc);
        } else if (jobId === 'idle') {
            npc.isAutonomous = true;
            npc.currentJob = 'idle';
            this.scene.startNPCMovement(npc);
        }
    }
}
