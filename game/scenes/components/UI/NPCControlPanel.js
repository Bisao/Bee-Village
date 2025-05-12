
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

                <div class="tab-content active" id="inventory-tab">
                    <h3>Ferramentas</h3>
                    <div class="tools-grid">
                        ${npc.config.tools.map(tool => `
                            <div class="tool-slot">
                                <div class="tool-icon">${tool.emoji}</div>
                                <div class="tool-info">
                                    <div class="tool-name">${tool.name}</div>
                                    <div class="tool-desc">${tool.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <h3>Inventário</h3>
                    <div class="inventory-grid">
                        ${Array(8).fill().map((_, i) => `
                            <div class="inventory-slot empty">
                                <div class="slot-icon">?</div>
                                <div class="slot-count">0/5</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tab-content" id="jobs-tab">
                    <div class="jobs-list">
                        <button class="job-btn rest-btn">
                            ☕ Descansar
                        </button>
                        ${this.getJobButtonByProfession(npc.config.profession)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        this.setupEventListeners(modal, npc);
    }

    getJobButtonByProfession(profession) {
        const jobs = {
            'Lumberjack': '<button class="job-btn work-btn">🪓 Cortar Árvores</button>',
            'Miner': '<button class="job-btn work-btn">⛏️ Minerar</button>',
            'Farmer': '<button class="job-btn work-btn">🌾 Cultivar</button>',
            'Fisher': '<button class="job-btn work-btn">🎣 Pescar</button>'
        };
        return jobs[profession] || '';
    }

    setupEventListeners(modal, npc) {
        const closeBtn = modal.querySelector('.close-button');
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const restBtn = modal.querySelector('.rest-btn');
        const workBtn = modal.querySelector('.work-btn');

        closeBtn.onclick = () => modal.remove();

        // Tab switching
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tabId = btn.getAttribute('data-tab');
                modal.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                modal.querySelector(`#${tabId}-tab`).classList.add('active');
            };
        });

        // Rest button
        if (restBtn) {
            restBtn.onclick = () => {
                npc.setRestMode(true);
                this.updateJobButtons(restBtn, workBtn);
            };
        }

        // Work button
        if (workBtn) {
            workBtn.onclick = () => {
                npc.setRestMode(false);
                this.updateJobButtons(workBtn, restBtn);
            };
        }
    }

    updateJobButtons(activeBtn, inactiveBtn) {
        if (activeBtn) activeBtn.classList.add('active');
        if (inactiveBtn) inactiveBtn.classList.remove('active');
    }
}
