const photoInput = document.getElementById("familyPhotoUpload");
const preview = document.getElementById("familyPhotoPreview");
const container = document.getElementById("familyPhotoContainer");

photoInput?.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            container.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
    }
});
