window.addEventListener("DOMContentLoaded", () => {
    const pages = document.querySelectorAll("nav a");
    pages.forEach(page => {
        if (page.href === window.location.href) {
            page.classList.add("bg-sky-400");
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const showSidebar = document.getElementById("showSidebar");
    const sidebar = document.getElementById("sidebar");
    const closeSidebar = document.getElementById("closeSidebar");
    const overlay = document.getElementById("overlay");

    showSidebar.addEventListener("click", () => {
        console.log("Sidebar button clicked");
        sidebar.classList.remove("hidden");
        overlay.classList.remove("hidden");

    });

    closeSidebar.addEventListener("click", () => {
        sidebar.classList.add("hidden");
        overlay.classList.add("hidden");
    });
});