const removePhotoEmptyMessage = document.getElementById("photoEmptyMessage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const photoGrid = document.getElementById("photoGrid");
const addMorePhotos = document.getElementById("addMorePhotosButton");

uploadButton.addEventListener("click", () => fileInput.click());
addMorePhotos.addEventListener("click", () => fileInput.click());

async function getComments(imageId) {
    return fetch(`/api/photos/${imageId}/comments`).then(res => res.json());
}

async function postComment(imageId, text) {
    return fetch(`/api/photos/${imageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    }).then(res => res.json());
}

function openMemoryModal(memory) {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-2";
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const modalContent = document.createElement('div');
    modalContent.className = "bg-white max-h-[90vh] overflow-y-auto w-full max-w-md rounded-xl p-4 shadow-md";

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.className = "float-right text-gray-500 hover:text-gray-700 text-lg mb-2";
    closeButton.addEventListener('click', () => modal.remove());

    const img = document.createElement('img');
    img.src = `http://localhost:8000/${memory.file_location}`;
    img.alt = memory.tags || "Family memory";
    img.className = "w-full h-auto rounded mb-4";

    const description = document.createElement('p');
    description.textContent = memory.description || "No description provided.";
    description.className = "text-gray-700 mb-3";

    const geolocation = document.createElement('p');
    geolocation.className = "text-sm text-gray-500 mb-4";
    geolocation.textContent = `Geolocation: Latitude ${memory.geolocation?.lat ?? "N/A"}, Longitude ${memory.geolocation?.lon ?? "N/A"}`;

    const commentsSection = document.createElement('div');
    commentsSection.className = "mb-2";
    const commentsList = document.createElement('div');
    commentsList.className = "space-y-1 max-h-40 overflow-y-auto";

    const commentForm = document.createElement('form');
    commentForm.className = "flex gap-2 mt-2";
    const input = document.createElement('input');
    input.type = "text";
    input.placeholder = "Write a comment...";
    input.className = "flex-grow border rounded px-3 py-2 text-sm";
    const send = document.createElement('button');
    send.innerHTML = '<i class="fas fa-paper-plane"></i>';
    send.className = "bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700";

    commentForm.appendChild(input);
    commentForm.appendChild(send);

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        await postComment(memory.id, text);
        input.value = "";
        await loadComments();
    });

    commentsSection.appendChild(commentsList);
    commentsSection.appendChild(commentForm);

    modalContent.append(closeButton, img, description, geolocation, commentsSection);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    async function loadComments() {
        const comments = await getComments(memory.id);
        commentsList.innerHTML = "";
        comments.forEach(c => {
            const p = document.createElement('p');
            p.textContent = `${c.user}: ${c.text}`;
            p.className = "text-gray-800 text-sm";
            commentsList.appendChild(p);
        });
    }

    loadComments();
}

fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    addMorePhotos.classList.remove('hidden');
    removePhotoEmptyMessage.classList.add('hidden');

    const reader = new FileReader();
    reader.onload = async function (e) {
        const imageData = e.target.result;
        const location = await getGeolocation();
        const token = localStorage.getItem("token");
        const familyId = localStorage.getItem("familyId");

        try {
            const response = await fetch("http://localhost:8000/memories/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    location: location ? `${location.lat},${location.lon}` : "Unknown",
                    tags: "untagged",
                    file_location: imageData,
                    family_id: parseInt(familyId),
                    time_stamp: new Date().toISOString()
                })
            });

            const newMemory = await response.json();

            const img = document.createElement('img');
            img.src = `http://localhost:8000/${newMemory.file_location}`;
            img.dataset.imageId = newMemory.id;
            img.className = "max-w-full h-auto rounded shadow cursor-pointer";

            photoGrid.appendChild(img);
            img.addEventListener('click', () => openMemoryModal(newMemory));

        } catch (err) {
            console.error("Error uploading memory:", err);
        }
    };
    reader.readAsDataURL(file);
});

async function getGeolocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                console.warn("Geolocation error:", error);
                resolve(null);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    });
}

async function loadRecentMemories() {
    try {
        const response = await fetch('http://127.0.0.1:8000/memories/recent');
        const rawText = await response.text();
        console.log("RAW response from /memories/recent:", rawText);
        const memories = JSON.parse(rawText);
        const container = document.getElementById("recentMemories");
        container.innerHTML = "";

        if (memories.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full">No recent memories found.</p>';
            return;
        }

        memories.forEach(memory => {
            const card = document.createElement("div");
            card.className = "rounded border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition p-1 cursor-pointer";

            const img = document.createElement("img");
            img.src = memory.file_location;
            img.alt = memory.tags;
            img.className = "w-full h-40 object-cover";
            img.dataset.imageId = memory.id;

            const caption = document.createElement("div");
            caption.className = "p-2 text-sm font-medium text-gray-700 truncate";
            caption.textContent = memory.tags;

            card.appendChild(img);
            card.appendChild(caption);
            container.appendChild(card);

            card.addEventListener("click", () => openMemoryModal(memory));
        });
    } catch (err) {
        console.error("Failed to load recent memories", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadRecentMemories();
});
