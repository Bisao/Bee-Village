
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
                try {
    game = new Phaser.Game(config);
    window.addEventListener('error', (e) => {
        console.error('Game Error:', e);
        alert('Ops! Ocorreu um erro. Tente recarregar a página.');
    });
} catch (error) {
    console.error('Initialization Error:', error);
    alert('Não foi possível iniciar o jogo. Verifique se seu dispositivo é compatível.');
}

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

// Theme switching
const themeButtons = document.querySelectorAll('.theme-btn');
const applyThemeBtn = document.getElementById('apply-theme');
let selectedTheme = localStorage.getItem('selectedTheme') || 'bee';

let previewTheme = localStorage.getItem('selectedTheme') || 'bee';

function applyThemeChanges(theme, save = false) {
    const selectedButton = document.querySelector(`.theme-btn[data-theme="${theme}"]`);
    const selectedEmoji = selectedButton.dataset.emoji;
    
    // Atualizar emoji do bee
    const beeElements = document.querySelectorAll('.bee');
    beeElements.forEach(element => {
        element.textContent = selectedEmoji;
    });
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update emojis
    const flowerElements = [
        '.topbar h1 .flower',
        '.start-screen h1 span:first-child',
        '.start-screen h1 span:last-child'
    ];
    
    flowerElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.textContent = selectedEmoji;
    });

    // Update UI colors based on theme
    document.body.style.background = getComputedStyle(document.documentElement).getPropertyValue('--background-color');

    if (save) {
        localStorage.setItem('selectedTheme', theme);
        localStorage.setItem('selectedEmoji', selectedEmoji);
        
        // Force a repaint on saved theme
        requestAnimationFrame(() => {
            document.body.style.transition = 'background-color 0.3s ease';
            document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color');
        });
    }
}

themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const theme = button.dataset.theme;
        previewTheme = theme;
        themeButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        applyThemeBtn.classList.add('visible');
        applyThemeChanges(theme, false);
    });
});

applyThemeBtn.addEventListener('click', () => {
    applyThemeChanges(previewTheme, true);
    applyThemeBtn.classList.remove('visible');
    
    // Update UI elements with new theme
    document.querySelectorAll('[class*="button"], [class*="btn"], .topbar, .loading-overlay, #side-panel, .settings-panel').forEach(element => {
        element.style.setProperty('--primary-color', getComputedStyle(document.documentElement).getPropertyValue('--primary-color'));
        element.style.setProperty('--secondary-color', getComputedStyle(document.documentElement).getPropertyValue('--secondary-color'));
        element.style.setProperty('--accent-color', getComputedStyle(document.documentElement).getPropertyValue('--accent-color'));
    });

    // Update emojis
    document.querySelector('.topbar h1 .flower').textContent = selectedEmoji;
    document.querySelector('.start-screen h1 span:first-child').textContent = selectedEmoji;
    document.querySelector('.start-screen h1 span:last-child').textContent = selectedEmoji;
});

// Load saved emoji
const savedEmoji = localStorage.getItem('selectedEmoji') || '🐝';
document.querySelector('.topbar h1 .flower').textContent = savedEmoji;
document.querySelector('.start-screen h1 span:first-child').textContent = savedEmoji;
document.querySelector('.start-screen h1 span:last-child').textContent = savedEmoji;

// Inicializar tema antes do carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('selectedTheme') || 'cow';
    let savedEmoji = '🐄';
    
    if (savedTheme === 'pig') {
        savedEmoji = '🐖';
    } else if (savedTheme === 'cow') {
        savedEmoji = '🐄';
    }
    
    // Aplicar tema imediatamente
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.classList.add('theme-loaded');
    
    // Atualizar emojis na interface
    const beeElements = document.querySelectorAll('.bee');
    beeElements.forEach(element => {
        element.textContent = savedEmoji;
    });
    
    // Forçar aplicação do tema
    requestAnimationFrame(() => {
        applyThemeChanges(savedTheme, true);
    });
});
document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`)?.classList.add('selected');

// Aplicar tema ao documento
applyThemeChanges(savedTheme, false);

// Adicionar classe para prevenir flash de tema padrão
document.documentElement.classList.add('theme-loaded');

document.getElementById('settings-button').addEventListener('click', () => {
    moveBeeToButton('settings');
    setTimeout(() => {
        document.getElementById('settings-panel').classList.add('visible');
        isTransitioning = false;
    }, 1000);
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
