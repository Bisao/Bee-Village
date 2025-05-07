// Game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a1a',
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

    // Show theme icon immediately
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.className = 'theme-icon play visible';
    }

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
    setTimeout(() => {
        const beeIcon = document.querySelector('.bee-icon');
        if (beeIcon) {
            beeIcon.className = 'bee-icon play visible';
        }
    }, 100);

    // Handle play button
    let isTransitioning = false;
    document.getElementById('play-button')?.addEventListener('click', () => {
        if (isTransitioning) return;
        isTransitioning = true;

        moveBeeToButton('play');
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'flex';
            startGameWithLoading();
        }, 1000);
    });

    // Handle settings button
    document.getElementById('settings-button')?.addEventListener('click', () => {
        if (isTransitioning) return;
        moveBeeToButton('settings');
        setTimeout(() => {
            document.getElementById('settings-panel').classList.add('visible');
            isTransitioning = false;
        }, 1000);
    });

    // Handle back button
    document.querySelector('.back-button')?.addEventListener('click', () => {
        document.getElementById('settings-panel')?.classList.remove('visible');
        const beeIcon = document.querySelector('.theme-icon');
        if (beeIcon) {
            beeIcon.className = 'theme-icon play visible';
        }
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
        if (progressBar) {
            progressBar.style.width = `${loadingProgress}%`;
        }

        if (loadingProgress >= 100) {
            clearInterval(loadingInterval);
            try {
                window.game = new Phaser.Game(config);

                window.game.events.once('ready', () => {
                    setTimeout(() => {
                        const loadingScreen = document.getElementById('loading-screen');
                        const startScreen = document.getElementById('start-screen');
                        if (loadingScreen) loadingScreen.style.display = 'none';
                        if (startScreen) startScreen.style.display = 'none';
                    }, 500);
                });
            } catch (error) {
                console.error('Game initialization error:', error);
                alert('Failed to start the game. Please try refreshing the page.');
            }
        }
    }, 50);
}


export default config;