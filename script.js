
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarButton = document.getElementById('close-sidebar');
    
    menuButton.addEventListener('click', () => {
        sidebar.classList.add('active');
    });
    
    closeSidebarButton.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuButton.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
});
