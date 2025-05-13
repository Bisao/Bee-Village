export default class ResourceSystem {
    constructor(scene) {
        this.scene = scene;
        this.silos = new Map();
    }

    registerSilo(x, y, sprite) {
        const key = `${x},${y}`;
        this.silos.set(key, {
            sprite: sprite,
            resources: {
                wood: 0,
                wheat: 0,
                ore: 0
            }
        });
    }

    getSiloResources(x, y) {
        const key = `${x},${y}`;
        return this.silos.get(key)?.resources || {
            wood: 0,
            wheat: 0,
            ore: 0
        };
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
                                <div class="resource-amount">${resources.wood || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.wood || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="resource-category">
                        <h3>🌾 Recursos Agrícolas</h3>
                        <div class="resource-item">
                            <div class="resource-icon">🌾</div>
                            <div class="resource-info">
                                <div class="resource-name">Trigo</div>
                                <div class="resource-amount">${resources.wheat || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.wheat || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="resource-category">
                        <h3>⛏️ Recursos Minerais</h3>
                        <div class="resource-item">
                            <div class="resource-icon">⛏️</div>
                            <div class="resource-info">
                                <div class="resource-name">Minério</div>
                                <div class="resource-amount">${resources.ore || 0}</div>
                            </div>
                            <div class="resource-progress">
                                <div class="progress-bar" style="width: ${(resources.ore || 0) / 100 * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => {
            modal.remove();
        };
    }
        this.silos = new Map();
        this.resources = {
            wood: 0,
            wheat: 0,
            ore: 0,
            fish: 0
        };
    }

    registerSilo(x, y, sprite) {
        const key = `${x},${y}`;
        this.silos.set(key, {
            position: { x, y },
            sprite: sprite,
            resources: {
                wood: 0,
                wheat: 0,
                ore: 0,
                fish: 0
            }
        });
    }

    getSiloResources(x, y) {
        const key = `${x},${y}`;
        const silo = this.silos.get(key);
        return silo ? silo.resources : null;
    }

    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            this.resources[type] += amount;
            this.scene.events.emit('resourceUpdated', { type, amount: this.resources[type] });
        }
    }

    removeResource(type, amount) {
        if (this.resources.hasOwnProperty(type) && this.resources[type] >= amount) {
            this.resources[type] -= amount;
            this.scene.events.emit('resourceUpdated', { type, amount: this.resources[type] });
            return true;
        }
        return false;
    }

    // Adiciona um silo ao sistema
    registerSilo(x, y, silo) {
        const key = `${x},${y}`;
        this.silos.set(key, {
            position: { x, y },
            sprite: silo,
            storage: {
                wood: 0,
                wheat: 0,
                ore: 0,
                fish: 0
            },
            capacity: 100 // Capacidade máxima por recurso
        });
    }

    // Adiciona recursos a um silo específico
    depositResource(siloX, siloY, resourceType, amount) {
        const key = `${siloX},${siloY}`;
        const silo = this.silos.get(key);

        if (!silo) return false;

        if (silo.storage[resourceType] + amount <= silo.capacity) {
            silo.storage[resourceType] += amount;
            return true;
        }
        return false;
    }

    // Retorna recursos de um silo específico
    getSiloResources(siloX, siloY) {
        const key = `${siloX},${siloY}`;
        const silo = this.silos.get(key);
        return silo ? silo.storage : null;
    }

    // Verifica se há espaço no silo
    hasSiloSpace(siloX, siloY, resourceType, amount) {
        const key = `${siloX},${siloY}`;
        const silo = this.silos.get(key);
        return silo && (silo.storage[resourceType] + amount <= silo.capacity);
    }

    // Encontra o silo mais próximo
    findNearestSilo(x, y) {
        let nearest = null;
        let shortestDistance = Infinity;

        for (const [key, silo] of this.silos) {
            const [siloX, siloY] = key.split(',').map(Number);
            const distance = Math.abs(x - siloX) + Math.abs(y - siloY);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearest = { x: siloX, y: siloY, silo };
            }
        }

        return nearest;
    }

    // Salva o estado dos recursos
    save() {
        const state = {
            resources: this.resources,
            silos: Array.from(this.silos.entries())
        };
        return state;
    }

    // Carrega o estado dos recursos
    load(state) {
        if (state.resources) {
            this.resources = state.resources;
        }
        if (state.silos) {
            this.silos = new Map(state.silos);
        }
    }
}