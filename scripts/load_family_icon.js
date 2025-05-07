document.addEventListener("DOMContentLoaded", () => {
    fetch("../components/family_icon.html")
        .then(res => res.text())
        .then(data => {
            const container = document.getElementById("familyIconContainer");
            if (!container) return;

            container.innerHTML = data;

            const input = document.getElementById("familyIconInput");
            const preview = document.getElementById("familyIconPreview");

            input?.addEventListener("change", function () {
                const file = this.files[0];
                if (file && preview) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        preview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        })
        .catch(err => console.error("Icon load error:", err));
});
