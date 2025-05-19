
export default class ResourceSystem {
    constructor(scene) {
        this.scene = scene;
        this.resources = {
            wood: 0,
            wheat: 0,
            ore: 0,
            fish: 0
        };
        this.silos = new Map(); // Armazena referências dos silos e seus recursos
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
            
            // Atualiza UI do silo se estiver aberta
            const siloModal = document.querySelector('.silo-modal');
            if (siloModal) {
                const resourceElement = siloModal.querySelector(`[data-resource="${resourceType}"]`);
                if (resourceElement) {
                    resourceElement.textContent = silo.storage[resourceType];
                }
            }
            
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
