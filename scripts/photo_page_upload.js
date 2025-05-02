const removePhotoEmptyMessage = document.getElementById("photoEmptyMessage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const photoGrid = document.getElementById("photoGrid");

uploadButton.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = function (event) {
            // Hide empty message
            removePhotoEmptyMessage.classList.add('hidden');

            // Create and style the image
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = "max-w-full h-auto rounded shadow";

            // Add to photo grid
            photoGrid.appendChild(img);
        };

        reader.readAsDataURL(file);
    } else {
        if (grid.children.length === 0) {
            removePhotoEmptyMessage.classList.remove('hidden');
        }
    }
});