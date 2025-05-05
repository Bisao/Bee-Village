
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

let game;

const beeIcon = document.querySelector('.bee-icon');

// Show bee when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        beeIcon.className = 'bee-icon play visible';
    }, 100);
});

function moveBeeToButton(buttonType) {
    beeIcon.style.animation = 'flyToButton 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    beeIcon.className = `bee-icon ${buttonType} visible`;
}

let isTransitioning = false;

document.getElementById('play-button').addEventListener('click', () => {
    if (isTransitioning) return;
    isTransitioning = true;
    let loadingProgress = 0;
    
    moveBeeToButton('play');
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'flex';
        
        const progressBar = document.querySelector('.loading-progress');
        const loadingInterval = setInterval(() => {
            loadingProgress += 2;
            progressBar.style.width = `${loadingProgress}%`;
            
            if (loadingProgress >= 100) {
                clearInterval(loadingInterval);
                game = new Phaser.Game(config);

                // Wait for the game to actually load before hiding screens
                game.events.once('ready', () => {
                    setTimeout(() => {
                        document.getElementById('loading-screen').style.display = 'none';
                        document.getElementById('start-screen').style.display = 'none';
                    }, 2000);
                });
            }
        }, 50);
    }, 3000);
});

document.getElementById('settings-button').addEventListener('click', () => {
    if (isTransitioning) return;
    isTransitioning = true;
    
    moveBeeToButton('settings');
    setTimeout(() => {
        document.getElementById('settings-panel').classList.add('visible');
        isTransitioning = false;
    }, 1000);
});

document.querySelector('.back-button').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.remove('visible');
    beeIcon.className = 'bee-icon play visible';
});

document.getElementById('settings-button').addEventListener('click', () => {
    moveBeeToButton('settings');
    setTimeout(() => {
        alert('Configurações em desenvolvimento');
    }, 3000);
});

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
    game.scale.on('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });
    
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        }, 100);
    });
}
