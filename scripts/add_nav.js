// Load top nav and attach sidebar logic after it's added
fetch("./components/nav_top_auth.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("topNav").innerHTML = html;

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

// Load bottom nav
fetch("./components/nav_bottom.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("bottomNav").innerHTML = html;
       
        
            const pages = document.querySelectorAll("nav a");
            pages.forEach(page => {
                if (page.href === window.location.href) {
                    page.classList.add("bg-sky-400");
                }
            });

    });