
import MainScene from './scenes/MainScene.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2b2b2b', // Dark background for contrast
    scene: MainScene,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    window.addEventListener('touchstart', function startGame() {
        if (game.scale && typeof game.scale.startFullscreen === 'function') {
            game.scale.startFullscreen();
        }
        window.removeEventListener('touchstart', startGame);
    });
}
