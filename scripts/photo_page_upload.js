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
    return [
        { user: "Alice", text: "Nice shot!" },
        { user: "Bob", text: "Great view." }
    ];
}

// Comment posting API
async function postComment(imageId, text) {
    console.log(`(faked) POST comment "${text}" for image ${imageId}`);
    return { success: true };
}

// --- Image Data API ---
async function getImageData(imageId) {
    const location = await getLocation();
    return {
        src: document.querySelector(`img[data-image-id="${imageId}"]`).src,
        description: "This is a sample description for the image.",
        tags: "sample, test", // Example tags
        geolocation: { lat: 49.2827, lon: -123.1207 } // Example coords
    };
}

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        addMorePhotos.classList.remove('hidden');

        const reader = new FileReader();

        reader.onload = function (event) {
            removePhotoEmptyMessage.classList.add('hidden');

            const img = document.createElement('img');
            img.src = event.target.result;
            img.dataset.imageId = Date.now().toString();
            img.className = "max-w-full h-auto rounded shadow";

            img.addEventListener('click', async () => {
                const data = await getImageData(img.dataset.imageId);

                const modal = document.createElement('div');
                modal.className = "fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50";
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });

                const modalContent = document.createElement('div');
                modalContent.className = "bg-white pt-2 pb-6 px-6 rounded shadow-lg max-w-md w-full";

                const header = document.createElement('div');
                header.className = "flex justify-end";

                const closeButton = document.createElement('button');
                closeButton.innerHTML = '<i class="fas fa-times"></i>';
                closeButton.className = "text-gray-600 hover:text-gray-800 p-4 text-xl";
                closeButton.addEventListener('click', () => modal.remove());
                header.appendChild(closeButton);
                modalContent.appendChild(header);

                const modalImage = document.createElement('img');
                modalImage.src = data.src;
                modalImage.className = "w-full h-auto rounded mb-4";
                modalContent.appendChild(modalImage);

                const description = document.createElement('p');
                description.innerText = data.description;
                description.className = "text-gray-700 mb-4";
                modalContent.appendChild(description);

                const tags = document.createElement('p');
                tags.innerText = `Tags: ${data.tags}`;
                tags.className = "text-gray-700 mb-4";
                modalContent.appendChild(tags);

                const editButton = document.createElement('button');
                editButton.innerHTML = '<i class="fas fa-edit"></i>';
                editButton.className = "bg-sky-400 text-white px-2 py-1 hover:bg-sky-300 rounded mr-2 mb-4";
                modalContent.appendChild(editButton);

                const geolocation = document.createElement('p');
                geolocation.innerText = `Geolocation: Latitude ${data.geolocation.lat}, Longitude ${data.geolocation.lon}`;
                geolocation.className = "text-gray-500 mb-4";
                modalContent.appendChild(geolocation);

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
                modal.appendChild(modalContent);
                document.body.appendChild(modal);

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

                commentForm.addEventListener('submit', async e => {
                    e.preventDefault();
                    const text = commentInput.value.trim();
                    if (!text) return;
                    await postComment(img.dataset.imageId, text);
                    commentInput.value = "";
                    await loadComments();
                });

                loadComments();
            });

            photoGrid.appendChild(img);
        };

        reader.readAsDataURL(file);
    } else {
        if (photoGrid.children.length === 0) {
            removePhotoEmptyMessage.classList.remove('hidden');
        }
    }
});

async function uploadMemory({ location, fileLocation, tags, familyId, timeStamp }) {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:8000/memories", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            location,
            tags,
            file_location: fileLocation,
            family_id: familyId,
            time_stamp: timeStamp
        })
    });

    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        const errorText = contentType && contentType.includes("application/json")
            ? (await response.json()).detail
            : await response.text();

        throw new Error(errorText || "Upload failed.");
    }

    return await response.json();
}
