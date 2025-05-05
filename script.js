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
    const structuresBtn = document.getElementById('toggleStructures');
    const sidePanel = document.getElementById('side-panel');
    const fullscreenBtn = document.getElementById('toggleFullscreen');

    structuresBtn.addEventListener('click', () => {
        sidePanel.style.display = sidePanel.style.display === 'none' ? 'flex' : 'none';
    });

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });
});
</script>

</body>
</html>