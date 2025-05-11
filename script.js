<!DOCTYPE html>
<html>
<head>
<title>Structures Panel</title>
<style>
#side-panel {
  display: none; /* Initially hidden */
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background-color: #f0f0f0;
  /* Add more styles as needed */
  flex-direction: column;
  align-items: center;
}

#toggleStructures {
  position: fixed;
  top: 10px; /* Adjust as needed */
  right: 10px; /* Adjust as needed */
  padding: 10px;
  border: none;
  cursor: pointer;
  background-color: transparent; /* Make background transparent */
}

#toggleStructures img {
  /* Adjust the image size as needed to fit the button */
  width: 30px;
  height: 30px;
}

#settings-panel {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent overlay */
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Ensure it's on top */
}

#settings-panel.visible {
    display: flex;
}


.settings-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
}

.back-button {
    position: absolute;
    top: 10px;
    left: 10px;
    cursor: pointer;
}
</style>
</head>
<body>

<button id="toggleStructures">
  <img src="farmhouse_icon.png" alt="Toggle Structures"> </button>  <!-- Replace farmhouse_icon.png with your actual image path -->

<div id="side-panel">
  <!-- Content for the structures panel -->
  <h2>Structures</h2>
  <ul>
    <li>Barn</li>
    <li>Silo</li>
    <li>House</li>
  </ul>
</div>

<div id="settings-panel" class="settings-panel">
    <div class="settings-content" id="settings-content">
        <div class="settings-header">
            <h2>Configurações</h2>
            <button class="back-button">✖</button>
        </div>
        <div class="settings-options">
            <div class="setting-item">
                <label>Som do Jogo</label>
                <input type="range" id="gameSound" min="0" max="100" value="50">
            </div>
            <div class="setting-item">
                <label>Música de Fundo</label>
                <input type="range" id="backgroundMusic" min="0" max="100" value="50">
            </div>
            <div class="setting-item">
                <label>Zoom Padrão</label>
                <input type="range" id="defaultZoom" min="50" max="200" value="100">
            </div>
        </div>
    </div>
</div>


<script>
function showFeedback(message, duration = 2000) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.textContent = message;
    document.body.appendChild(feedback);

    requestAnimationFrame(() => {
        feedback.classList.add('visible');
        setTimeout(() => {
            feedback.classList.remove('visible');
            setTimeout(() => feedback.remove(), 300);
        }, duration);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const startScreen = document.getElementById('start-screen');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const backButton = document.querySelector('.back-button');

    // Settings panel controls
    settingsButton?.addEventListener('click', () => {
        settingsPanel.style.display = 'flex';
        settingsPanel.classList.add('visible');
    });

    backButton?.addEventListener('click', () => {
        settingsPanel.classList.remove('visible');
        setTimeout(() => {
            settingsPanel.style.display = 'none';
        }, 300);
    });

    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!button.disabled) {
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                const tabId = `${button.dataset.tab}-tab`;
                document.getElementById(tabId)?.classList.add('active');
            }
        });
    });

    const structuresBtn = document.getElementById('toggleStructures');
    const sidePanel = document.getElementById('side-panel');

    // Settings controls
    const gameSoundControl = document.getElementById('gameSound');
    const backgroundMusicControl = document.getElementById('backgroundMusic');
    const defaultZoomControl = document.getElementById('defaultZoom');

    // Load saved settings
    const settings = loadSettings();
    gameSoundControl.value = settings.gameSound;
    backgroundMusicControl.value = settings.backgroundMusic;
    defaultZoomControl.value = settings.defaultZoom;

    // Settings event listeners
    gameSoundControl?.addEventListener('input', () => {
        saveSettings({
            ...loadSettings(),
            gameSound: gameSoundControl.value
        });
        updateGameSound(gameSoundControl.value);
    });

    backgroundMusicControl?.addEventListener('input', () => {
        saveSettings({
            ...loadSettings(),
            backgroundMusic: backgroundMusicControl.value
        });
        updateBackgroundMusic(backgroundMusicControl.value);
    });

    defaultZoomControl?.addEventListener('input', () => {
        saveSettings({
            ...loadSettings(),
            defaultZoom: defaultZoomControl.value
        });
        updateDefaultZoom(defaultZoomControl.value);
    });

    structuresBtn?.addEventListener('click', () => {
        sidePanel.style.display = sidePanel.style.display === 'none' ? 'flex' : 'none';
    });
});

// Settings management functions
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Erro ao tentar entrar em tela cheia: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Adiciona listeners para o botão de tela cheia
document.addEventListener('DOMContentLoaded', () => {
    const fullscreenButton = document.getElementById('fullscreen-button');
    const playButton = document.getElementById('play-button');
    
    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', toggleFullScreen);
    }
    
    if (playButton) {
        playButton.addEventListener('click', () => {
            toggleFullScreen();
            // Adicione aqui qualquer outra lógica necessária ao clicar em play
        });
    }
});

function loadSettings() {
    const defaultSettings = {
        gameSound: 50,
        backgroundMusic: 50,
        defaultZoom: 100
    };

    const savedSettings = localStorage.getItem('gameSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
}

function saveSettings(settings) {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
}

function updateGameSound(value) {
    if (window.game) {
        const volume = value / 100;
        window.game.sound.volume = volume;
    }
}

function updateBackgroundMusic(value) {
    if (window.game) {
        const volume = value / 100;
        if (window.game.backgroundMusic) {
            window.game.backgroundMusic.volume = volume;
        }
    }
}

function updateDefaultZoom(value) {
    if (window.game && window.game.scene.scenes[0]) {
        const zoom = value / 100;
        window.game.scene.scenes[0].cameras.main.setZoom(zoom);
    }
}
</script>

</body>
</html>