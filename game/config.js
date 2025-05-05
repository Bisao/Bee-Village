import MainScene from './scenes/MainScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2b2b2b',
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

// Theme handling
const currentTheme = localStorage.getItem('selectedTheme') || 'cow';
const currentEmoji = currentTheme === 'pig' ? '🐖' : '🐄';

function applyThemeChanges(theme, save = false) {
    const themeButton = document.querySelector(`.theme-btn[data-theme="${theme}"]`);
    const emoji = themeButton?.dataset.emoji || '🐄';

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('theme-loaded');

    // Update theme emojis
    document.querySelectorAll('.theme-emoji, .theme-icon').forEach(element => {
        if (element) element.textContent = emoji;
    });

    if (save) {
        localStorage.setItem('selectedTheme', theme);
        localStorage.setItem('selectedEmoji', emoji);
    }
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    // Apply initial theme
    applyThemeChanges(currentTheme, false);
    document.querySelector(`.theme-btn[data-theme="${currentTheme}"]`)?.classList.add('selected');

    // Setup theme buttons
    const themeButtons = document.querySelectorAll('.theme-btn');
    const applyThemeBtn = document.getElementById('apply-theme');
    let previewTheme = currentTheme;

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            previewTheme = button.dataset.theme;
            themeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            applyThemeBtn.classList.add('visible');
            applyThemeChanges(previewTheme, false);
        });
    });

    applyThemeBtn.addEventListener('click', () => {
        applyThemeChanges(previewTheme, true);
        applyThemeBtn.classList.remove('visible');
    });

    // Show bee icon
    const beeIcon = document.querySelector('.bee-icon');
    setTimeout(() => {
        beeIcon.className = 'bee-icon play visible';
    }, 100);

    // Handle play button
    let isTransitioning = false;
    document.getElementById('play-button').addEventListener('click', () => {
        if (isTransitioning) return;
        isTransitioning = true;

        moveBeeToButton('play');
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'flex';
            startGameWithLoading();
        }, 1000);
    });

    // Handle settings button
    document.getElementById('settings-button').addEventListener('click', () => {
        if (isTransitioning) return;
        moveBeeToButton('settings');
        setTimeout(() => {
            document.getElementById('settings-panel').classList.add('visible');
            isTransitioning = false;
        }, 1000);
    });

    // Handle back button
    document.querySelector('.back-button').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.remove('visible');
        beeIcon.className = 'bee-icon play visible';
    });
});

// Helper functions
function moveBeeToButton(buttonType) {
    const beeIcon = document.querySelector('.theme-icon');
    if (beeIcon) {
        beeIcon.style.animation = 'flyToButton 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        beeIcon.className = `theme-icon ${buttonType} visible`;
    }
}

function startGameWithLoading() {
    let loadingProgress = 0;
    const progressBar = document.querySelector('.loading-progress');
    const loadingInterval = setInterval(() => {
        loadingProgress += 2;
        progressBar.style.width = `${loadingProgress}%`;

        if (loadingProgress >= 100) {
            clearInterval(loadingInterval);
            try {
                window.game = new Phaser.Game(config);

                // Wait for game to load
                window.game.events.once('ready', () => {
                    setTimeout(() => {
                        document.getElementById('loading-screen').style.display = 'none';
                        document.getElementById('start-screen').style.display = 'none';
                    }, 500);
                });
            } catch (error) {
                console.error('Game initialization error:', error);
                alert('Failed to start the game. Please try refreshing the page.');
            }
        }
    }, 50);
}

// Mobile handling
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile && window.game) {
    window.game.scale.on('resize', () => {
        window.game.scale.resize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.game.scale.resize(window.innerWidth, window.innerHeight);
        }, 100);
    });
}