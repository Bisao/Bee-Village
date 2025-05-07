import StartScene from './scenes/StartScene.js';
import GameScene from './scenes/GameScene.js';
import SettingsScene from './scenes/SettingsScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a1a',
    scene: [StartScene, GameScene, SettingsScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

new Phaser.Game(config);