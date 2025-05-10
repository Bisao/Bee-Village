
export default class ShopSystem {
    constructor(scene) {
        this.scene = scene;
        this.items = {
            seeds: {
                wheat: { price: 10, icon: '🌾', name: 'Trigo' },
                carrot: { price: 15, icon: '🥕', name: 'Cenoura' },
                corn: { price: 20, icon: '🌽', name: 'Milho' },
                pumpkin: { price: 25, icon: '🎃', name: 'Abóbora' }
            },
            tools: {
                hoe: { price: 50, icon: '🦾', name: 'Enxada Melhorada' },
                watercan: { price: 40, icon: '💧', name: 'Regador Melhorado' },
                basket: { price: 30, icon: '🧺', name: 'Cesta Grande' }
            }
        };
    }

    openShop() {
        if (document.getElementById('shop-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'shop-modal';
        modal.className = 'game-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🏪 Loja</h2>
                    <button class="close-button">✕</button>
                </div>
                <div class="modal-tabs">
                    <button class="tab-btn active" data-tab="seeds">Sementes</button>
                    <button class="tab-btn" data-tab="tools">Ferramentas</button>
                </div>
                <div class="modal-body">
                    <div class="tab-content active" id="seeds-tab">
                        ${this.createItemList('seeds')}
                    </div>
                    <div class="tab-content" id="tools-tab">
                        ${this.createItemList('tools')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupEventListeners(modal);
    }

    createItemList(category) {
        return Object.entries(this.items[category])
            .map(([id, item]) => `
                <div class="shop-item">
                    <span class="item-icon">${item.icon}</span>
                    <div class="item-info">
                        <h3>${item.name}</h3>
                        <p>🪙 ${item.price}</p>
                    </div>
                    <button class="buy-btn" data-item="${id}" data-category="${category}">Comprar</button>
                </div>
            `).join('');
    }

    setupEventListeners(modal) {
        const closeBtn = modal.querySelector('.close-button');
        closeBtn.onclick = () => modal.remove();

        const tabs = modal.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                modal.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                modal.querySelector(`#${tab.dataset.tab}-tab`).classList.add('active');
            };
        });

        const buyButtons = modal.querySelectorAll('.buy-btn');
        buyButtons.forEach(btn => {
            btn.onclick = () => {
                const category = btn.dataset.category;
                const itemId = btn.dataset.item;
                const item = this.items[category][itemId];
                this.buyItem(category, itemId, item);
            };
        });
    }

    buyItem(category, itemId, item) {
        // Aqui você implementará a lógica de compra
        // Verificar dinheiro do jogador, adicionar ao inventário, etc
        console.log(`Comprando ${item.name} por ${item.price} moedas`);
        // Exemplo:
        if (this.scene.player.money >= item.price) {
            this.scene.player.money -= item.price;
            this.scene.player.inventory.addItem(category, itemId);
            this.scene.showFeedback(`${item.name} comprado!`, true);
        } else {
            this.scene.showFeedback('Moedas insuficientes!', false);
        }
    }
}
