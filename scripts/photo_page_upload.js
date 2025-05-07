import { getLocation } from './geolocation.js';

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

// --- Comment fetch APIs ---
async function getComments(imageId) {
    // Real route would be:
    // return fetch(`http://localhost:3000/api/photos/${imageId}/comments`)
    //     .then(res => res.json());
    // FAKE response:
    return [
        { user: "Alice", text: "Nice shot!" },
        { user: "Bob", text: "Great view." }
    ];
}

// Comment posting API
async function postComment(imageId, text) {
    // Real route would be:
    // return fetch(`http://localhost:3000/api/photos/${imageId}/comments`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ text })
    // }).then(res => res.json());
    // FAKE behavior:
    console.log(`(faked) POST comment "${text}" for image ${imageId}`);
    return { success: true };
}

// --- Image Data API ---
async function getImageData(imageId) {
    // Real route would be:
    // return fetch(`http://localhost:3000/api/photos/${imageId}`)
    //     .then(res => res.json());
    // FAKE response:
    const location = await getLocation();
    return {
        src: document.querySelector(`img[data-image-id="${imageId}"]`).src,
        description: "This is a sample description for the image.",
        geolocation: { location }
    };
}

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
            img.dataset.imageId = Date.now().toString();
            img.className = "max-w-full h-auto rounded shadow";

            // Create a modal 
            img.addEventListener('click', async () => {
                // Fetch image metadata
                const data = await getImageData(img.dataset.imageId);

                const modal = document.createElement('div');
                modal.className = "fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50";
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
                const modalContent = document.createElement('div');
                // Reduced top padding to remove extra space above the header:
                modalContent.className = "bg-white pt-2 pb-6 px-6 rounded shadow-lg max-w-md w-full";

                // Create a header for the close button
                const header = document.createElement('div');
                header.className = "flex justify-end";

                const closeButton = document.createElement('button');
                closeButton.innerHTML = '<i class="fas fa-times"></i>';
                closeButton.className = "text-gray-600 hover:text-gray-800 p-4 text-xl";
                closeButton.addEventListener('click', () => modal.remove());
                header.appendChild(closeButton);
                modalContent.appendChild(header);

                // Image in modal
                const modalImage = document.createElement('img');
                modalImage.src = data.src;
                modalImage.className = "w-full h-auto rounded mb-4";

                modalContent.appendChild(modalImage);

                // Description
                const description = document.createElement('p');
                description.innerText = data.description;
                description.className = "text-gray-700 mb-4";
                modalContent.appendChild(description);

                // Edit button
                const editButton = document.createElement('button');
                editButton.innerHTML = '<i class="fas fa-edit"></i>';
                editButton.className = "bg-sky-400 text-white px-2 py-1 hover:bg-sky-300 rounded mr-2 mb-4";
                modalContent.appendChild(editButton);

                // Geolocation
                const geolocation = document.createElement('p');
                geolocation.innerText =
                    `Geolocation: Latitude ${data.geolocation.lat}, Longitude ${data.geolocation.lon}`;
                geolocation.className = "text-gray-500 mb-4";
                modalContent.appendChild(geolocation);

                // — COMMENTS SECTION —
                const commentsSection = document.createElement('div');
                commentsSection.className = "comments-section mb-4";

                const commentsHeader = document.createElement('h3');
                commentsHeader.innerText = "Comments";
                commentsHeader.className = "text-lg font-semibold mb-2";
                commentsSection.appendChild(commentsHeader);

                const commentsList = document.createElement('div');
                commentsList.className = "comments-list max-h-40 overflow-auto mb-2";
                commentsSection.appendChild(commentsList);

                const commentForm = document.createElement('form');
                commentForm.className = "flex";
                const commentInput = document.createElement('input');
                commentInput.type = "text";
                commentInput.placeholder = "Add a comment…";
                commentInput.className = "flex-grow border p-2 mr-2 rounded";
                const commentSubmit = document.createElement('button');
                commentSubmit.type = "submit";
                commentSubmit.innerHTML = '<i class="fas fa-paper-plane"></i>';
                commentSubmit.className = "bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700  rounded";
                commentForm.appendChild(commentInput);
                commentForm.appendChild(commentSubmit);
                commentsSection.appendChild(commentForm);

                modalContent.appendChild(commentsSection);

                // Append modal content to the modal
                modal.appendChild(modalContent);

                // Append modal to the body
                document.body.appendChild(modal);

                // Fetch & render existing comments
                async function loadComments() {
                    const comments = await getComments(img.dataset.imageId);
                    commentsList.innerHTML = "";
                    comments.forEach(c => {
                        const p = document.createElement('p');
                        p.className = "text-gray-800 mb-1";
                        p.innerText = `${c.user}: ${c.text}`;
                        commentsList.appendChild(p);
                    });
                }

                // Handle new comment posts
                commentForm.addEventListener('submit', async e => {
                    e.preventDefault();
                    const text = commentInput.value.trim();
                    if (!text) return;
                    await postComment(img.dataset.imageId, text);
                    commentInput.value = "";
                    await loadComments();
                });

                // initial load
                loadComments();
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