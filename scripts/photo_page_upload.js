const removePhotoEmptyMessage = document.getElementById("photoEmptyMessage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const photoGrid = document.getElementById("photoGrid");
const addMorePhotos = document.getElementById("addMorePhotosButton");

uploadButton.addEventListener("click", () => {
    fileInput.click();
});

addMorePhotos.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        addMorePhotos.classList.remove('hidden');

        const reader = new FileReader();

        reader.onload = function (event) {
            // Hide empty message
            removePhotoEmptyMessage.classList.add('hidden');

            // Create and style the image
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = "max-w-full h-auto rounded shadow";


            // Create a modal 
            img.addEventListener('click', () => {
                const modal = document.createElement('div');
                modal.className = "fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"; 

                const modalContent = document.createElement('div');
                modalContent.className = "bg-white p-6 rounded shadow-lg max-w-md w-full";

                // Image in modal
                const modalImage = document.createElement('img');
                modalImage.src = img.src;
                modalImage.className = "w-full h-auto rounded mb-4";

                // Description
                const description = document.createElement('p');
                description.innerText = "This is a sample description for the image.";
                description.className = "text-gray-700 mb-4";

                // Geolocation
                const geolocation = document.createElement('p');
                geolocation.innerText = "Geolocation: Latitude 0.0000, Longitude 0.0000";
                geolocation.className = "text-gray-500 mb-4";

                // Edit button
                const editButton = document.createElement('button');
                editButton.innerText = "Edit";
                editButton.className = "bg-blue-500 text-white px-4 py-2 rounded mr-2";

                // Close button
                const closeButton = document.createElement('button');
                closeButton.innerText = "Close";
                closeButton.className = "bg-red-500 text-white px-4 py-2 rounded";
                closeButton.addEventListener('click', () => {
                    modal.remove();
                });

                // Append elements to modal 
                modalContent.appendChild(modalImage);
                modalContent.appendChild(description);
                modalContent.appendChild(geolocation);
                modalContent.appendChild(editButton);
                modalContent.appendChild(closeButton);

                // Append modal content to the modal
                modal.appendChild(modalContent);

                // Append modal to the body
                document.body.appendChild(modal);
            });

            // Add to photo grid
            photoGrid.appendChild(img);
        };

        reader.readAsDataURL(file);
    }

    else {
        if (photoGrid.children.length === 0) {
            removePhotoEmptyMessage.classList.remove('hidden');
        }
    }
});