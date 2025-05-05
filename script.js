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

<script>
document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('menuButton');
    const settingsPanel = document.getElementById('settings-panel');
    const backButton = document.querySelector('.back-button');

    menuButton.addEventListener('click', () => {
        settingsPanel.style.display = 'flex';
        requestAnimationFrame(() => {
            settingsPanel.classList.add('visible');
        });
    });

    backButton.addEventListener('click', () => {
        settingsPanel.classList.remove('visible');
        setTimeout(() => {
            settingsPanel.style.display = 'none';
        }, 300);
    });

    // Fechar o painel quando clicar fora dele
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !menuButton.contains(e.target) && settingsPanel.classList.contains('visible')) {
            backButton.click();
        }
    });

    // Handle theme selection
    const themeButtons = document.querySelectorAll('.theme-btn');
    const applyThemeBtn = document.getElementById('apply-theme');
    let previewTheme = 'bee';

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            themeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            previewTheme = button.dataset.theme;
            applyThemeBtn.classList.add('visible');
        });
    });

    applyThemeBtn.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', previewTheme);
        applyThemeBtn.classList.remove('visible');
    });

    // Side panel toggle functionality
    const structuresBtn = document.getElementById('toggleStructures');
    const sidePanel = document.getElementById('side-panel');

    structuresBtn.addEventListener('click', () => {
        sidePanel.style.display = sidePanel.style.display === 'none' ? 'flex' : 'none';
    });
});
</script>

</body>
</html>