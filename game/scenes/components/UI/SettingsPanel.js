
export default class SettingsPanel {
    constructor(scene) {
        this.scene = scene;
    }

    show() {
        this.cleanupExistingModals();
        const modal = this.createModal();
        document.body.appendChild(modal);
        this.setupEventListeners(modal);
    }

    cleanupExistingModals() {
        const existingModals = document.querySelectorAll('.settings-modal');
        existingModals.forEach(modal => modal.remove());
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'settings-modal dark-panel';
        modal.innerHTML = this.getModalHTML();
        return modal;
    }

    getModalHTML() {
        return `
            <div class="settings-content">
                <div class="settings-header">
                    <h2>⚙️ Configurações</h2>
                    <button class="close-button">✕</button>
                </div>
                <div class="settings-body">
                    <div class="settings-section">
                        <h3>Áudio</h3>
                        <div class="setting-item">
                            <label for="gameSound">Som do Jogo</label>
                            <input type="range" id="gameSound" min="0" max="100" value="50">
                        </div>
                        <div class="setting-item">
                            <label for="backgroundMusic">Música de Fundo</label>
                            <input type="range" id="backgroundMusic" min="0" max="100" value="30">
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Gráficos</h3>
                        <div class="setting-item">
                            <label for="defaultZoom">Zoom Padrão</label>
                            <input type="range" id="defaultZoom" min="50" max="150" value="100">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners(modal) {
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => modal.remove();
    }
}
