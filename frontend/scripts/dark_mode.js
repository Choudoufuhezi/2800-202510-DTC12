const toggle = document.getElementById('darkMode');

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
    toggle.checked = true;
} else {
    document.documentElement.classList.remove('dark');
    toggle.checked = false;
}

toggle.addEventListener('change', function () {
    if (this.checked) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
});