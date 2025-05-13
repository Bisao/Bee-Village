
export default class SiloPanel {
    static showSiloModal(resources) {
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

        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => modal.remove();
    }
}
