
export default class MobileManager {
    constructor(scene) {
        this.scene = scene;
        this.touchStartPos = null;
        this.pinchStartDistance = 0;
        this.currentZoom = 1;
        this.activeTouches = {};
        this.isPinching = false;
        this.setupTouchHandlers();
        this.setupOrientationHandler();
        console.log("MobileManager: Inicializado com suporte a gestos aprimorado");
    }

    setupTouchHandlers() {
        // Tratamento para eventos de toque
        this.scene.input.on('pointerdown', (pointer) => {
            this.activeTouches[pointer.id] = { x: pointer.x, y: pointer.y };
            
            // Se for o primeiro toque e não estamos em pinça
            if (Object.keys(this.activeTouches).length === 1 && !this.isPinching) {
                this.touchStartPos = { x: pointer.x, y: pointer.y };
                this.provideTactileFeedback();
            }
            
            // Se temos dois toques, iniciamos o modo de pinça
            if (Object.keys(this.activeTouches).length === 2) {
                this.isPinching = true;
                this.pinchStartDistance = this.calculatePinchDistance();
                this.currentZoom = this.scene.cameras.main.zoom;
                console.log("MobileManager: Pinça iniciada");
            }
        });

        this.scene.input.on('pointermove', (pointer) => {
            // Atualiza a posição do toque
            if (this.activeTouches[pointer.id]) {
                this.activeTouches[pointer.id] = { x: pointer.x, y: pointer.y };
            }
            
            // Se estamos em modo de pinça e temos dois toques
            if (this.isPinching && Object.keys(this.activeTouches).length === 2) {
                const currentDistance = this.calculatePinchDistance();
                const scaleFactor = currentDistance / this.pinchStartDistance;
                
                // Aplica zoom baseado na diferença do gesto de pinça
                const newZoom = this.currentZoom * scaleFactor;
                // Limita o zoom entre 0.3 e 2.0
                const clampedZoom = Math.max(0.3, Math.min(2.0, newZoom));
                this.scene.cameras.main.setZoom(clampedZoom);
                console.log("MobileManager: Zoom aplicado:", clampedZoom);
            } 
            // Se não estamos em pinça e temos um toque inicial, fazemos pan
            else if (this.touchStartPos && !this.isPinching) {
                const deltaX = pointer.x - this.touchStartPos.x;
                const deltaY = pointer.y - this.touchStartPos.y;
                this.handlePanGesture(deltaX, deltaY);
                // Atualiza a posição inicial para evitar saltos
                this.touchStartPos = { x: pointer.x, y: pointer.y };
            }
        });

        this.scene.input.on('pointerup', (pointer) => {
            // Remove o toque da lista
            delete this.activeTouches[pointer.id];
            
            // Se não temos mais toques, resetamos tudo
            if (Object.keys(this.activeTouches).length === 0) {
                this.touchStartPos = null;
                this.isPinching = false;
                console.log("MobileManager: Todos os toques liberados");
            }
            // Se saímos do modo de pinça mas ainda temos um toque
            else if (this.isPinching && Object.keys(this.activeTouches).length === 1) {
                this.isPinching = false;
                // Pega o toque restante e define como início do pan
                const remainingTouchId = Object.keys(this.activeTouches)[0];
                this.touchStartPos = this.activeTouches[remainingTouchId];
                console.log("MobileManager: Voltando para modo de pan");
            }
        });
    }

    calculatePinchDistance() {
        const touches = Object.values(this.activeTouches);
        if (touches.length < 2) return 0;
        
        const dx = touches[0].x - touches[1].x;
        const dy = touches[0].y - touches[1].y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    setupOrientationHandler() {
        window.addEventListener('orientationchange', () => {
            this.handleOrientation();
        });
    }

    handlePanGesture(deltaX, deltaY) {
        // Reduzimos o threshold para melhorar a resposta do pan
        if (Math.abs(deltaX) > 5) {
            // Pan camera com sensibilidade ajustada
            this.scene.cameras.main.scrollX -= deltaX;
        }
        if (Math.abs(deltaY) > 5) {
            this.scene.cameras.main.scrollY -= deltaY;
        }
    }

    provideTactileFeedback() {
        if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        
        // Visual feedback
        const circle = this.scene.add.circle(
            this.touchStartPos.x,
            this.touchStartPos.y,
            20,
            0xffffff,
            0.5
        );
        
        this.scene.tweens.add({
            targets: circle,
            scale: 1.5,
            alpha: 0,
            duration: 150,
            onComplete: () => circle.destroy()
        });
    }

    handleOrientation() {
        const orientation = window.orientation;
        const isLandscape = Math.abs(orientation) === 90;
        
        if (this.scene.screenManager) {
            this.scene.screenManager.adjustAllElements();
        }
        
        // Adjust camera zoom based on orientation
        const zoom = isLandscape ? 0.8 : 0.6;
        this.scene.cameras.main.setZoom(zoom);
    }
}
