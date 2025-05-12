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

                <div class="control-modes">
                    <button class="mode-btn ${npc.isAutonomous ? 'active' : ''}" id="autonomous">
                        🤖 Modo Autônomo
                    </button>
                    <button class="mode-btn ${!npc.isAutonomous ? 'active' : ''}" id="controlled">
                        🕹️ Modo Controlado 
                    </button>
                </div>

                <div class="mode-status">
                    <span>👁️ NPC se move livremente</span>
                </div>

                <div class="panel-tabs">
                    <button class="tab-btn active" data-tab="inventory">Inventário</button>
                    <button class="tab-btn" data-tab="jobs">Trabalhos</button>
                </div>

                <div class="tab-content" id="inventory-content">
                    <div class="tools-section">
                        ${npc.config.tools.map(tool => `
                            <div class="tool-card">
                                <div class="tool-icon">${tool.emoji}</div>
                                <div class="tool-info">
                                    <div class="tool-name">${tool.name}</div>
                                    <div class="tool-desc">${tool.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="inventory-grid">
                        ${Array(4).fill().map(() => `
                            <div class="inventory-slot">
                                <div class="slot-icon">🌳</div>
                                <div class="slot-count">0/1</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        this.setupEventListeners(modal, npc);
    }

    setupEventListeners(modal, npc) {
        const closeBtn = modal.querySelector('.close-button');
        closeBtn.onclick = () => modal.remove();

        const autonomousBtn = modal.querySelector('#autonomous');
        const controlledBtn = modal.querySelector('#controlled');

        autonomousBtn.onclick = () => {
            npc.isAutonomous = true;
            this.updateModeButtons(autonomousBtn, controlledBtn);
            this.scene.startNPCMovement(npc);
            modal.querySelector('.mode-status span').textContent = '👁️ NPC se move livremente';
        };

        controlledBtn.onclick = () => {
            npc.isAutonomous = false;
            this.updateModeButtons(controlledBtn, autonomousBtn);
            this.scene.enablePlayerControl(npc);
            modal.querySelector('.mode-status span').textContent = '🕹️ Use WASD para controlar';
        };
    }

    updateModeButtons(activeBtn, inactiveBtn) {
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
    }
}