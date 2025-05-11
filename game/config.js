
import StartScene from './scenes/StartScene.js';
import GameScene from './scenes/GameScene.js';
import SettingsScene from './scenes/SettingsScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#1a1a1a',
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: '100%',
        height: '100%',
        min: {
            width: 320,
            height: 480
        },
        max: {
            width: 1920,
            height: 1080
        },
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [StartScene, GameScene, SettingsScene],
    dom: {
        createContainer: true
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

window.addEventListener('load', () => {
    new Phaser.Game(config);
});
