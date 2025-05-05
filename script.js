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

<button id="togglePanel">Open Settings</button>
<div id="settings-panel">
    <div class="settings-content">
        <h2>Settings</h2>
        <button class="back-button">Close</button>
        <!-- Add your settings content here -->
    </div>
</div>


<script>
document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('togglePanel');
    const settingsPanel = document.getElementById('settings-panel');
    const backButton = document.querySelector('.back-button');
    const structuresBtn = document.getElementById('toggleStructures');
    const sidePanel = document.getElementById('side-panel');

    menuButton.addEventListener('click', () => {
        settingsPanel.style.display = 'flex';
        settingsPanel.classList.add('visible');
    });

    backButton.addEventListener('click', () => {
        settingsPanel.classList.remove('visible');
        setTimeout(() => {
            settingsPanel.style.display = 'none';
        }, 300);
    });

    structuresBtn.addEventListener('click', () => {
        sidePanel.style.display = sidePanel.style.display === 'none' ? 'flex' : 'none';
    });
});
</script>

</body>
</html>