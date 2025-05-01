fetch("components/nav_top_auth.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("topnav").innerHTML = html
    })

fetch("components/nav_bottom.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("botnav").innerHTML = html
    })