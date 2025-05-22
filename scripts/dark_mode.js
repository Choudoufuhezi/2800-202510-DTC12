// const toggle = document.getElementById('darkMode');

// if (localStorage.getItem('theme') === 'dark') {
//     document.documentElement.classList.add('dark');
//     toggle.checked = true;
// } else {
//     document.documentElement.classList.remove('dark');
//     toggle.checked = false;
// }

// toggle.addEventListener('change', function () {
//     if (this.checked) {
//         document.documentElement.classList.add('dark');
//         localStorage.setItem('theme', 'dark');
//     } else {
//         document.documentElement.classList.remove('dark');
//         localStorage.setItem('theme', 'light');
//     }
// });

// Apply theme globally (on any page)
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// Handle toggle only if it exists (e.g. settings page)
const toggle = document.getElementById('darkMode');

if (toggle) {
    toggle.checked = localStorage.getItem('theme') === 'dark';

    toggle.addEventListener('change', function () {
        if (this.checked) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    });
}
