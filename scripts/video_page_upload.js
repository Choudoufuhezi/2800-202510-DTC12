import { getLocation } from './geolocation.js';

const removeVideoEmptyMessage = document.getElementById("videoEmptyMessage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const videoGrid = document.getElementById("videoGrid");
const addMoreVideos = document.getElementById("addMoreVideosButton");

uploadButton.addEventListener("click", () => {
    fileInput.click();
});

addMoreVideos.addEventListener('click', () => {
    fileInput.click();
});


async function getComments(videoId) {
    return [
        { user: "Alice", text: "Nice shot!" },
        { user: "Bob", text: "Great view." }
    ];
}

async function getVideoData(videoId) {
    const location = await getLocation();
    const video = document.querySelector(`video[data-video-id="${videoId}"]`);
    return {
        src: video ? video.src : "",
        description: "This is a sample description for the video.",
        tags: "sample, test",
        geolocation: { location }
    };
}

async function uploadMemory({ location, file_url, cloudinary_id, tags, family_id }) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("http://localhost:8000/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ location, tags, file_url, cloudinary_id, family_id })
        });
        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to upload memory:", error);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function fetchFamilyMemberMemories(memberUserId, familyId) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`http://localhost:8000/memories/member/${memberUserId}/family/${familyId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to fetch family member memories:", error);
            return null;
        }
        const memories = await response.json();
        return memories;
    } catch (error) {
        console.error("Error fetching family member memories:", error);
        return null;
    }
}

async function deleteMemory(memoryId) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`http://localhost:8000/memories/${memoryId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to delete memory:", error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error deleting memory:", error);
        return false;
    }
}

function modal(video, data) {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50";
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const modalContent = document.createElement('div');
    modalContent.className = "bg-white pt-2 pb-6 px-6 rounded shadow-lg max-w-md w-full";

    const header = document.createElement('div');
    header.className = "flex justify-between items-center";

    const deleteButtonModal = document.createElement('button');
    deleteButtonModal.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButtonModal.className = "text-red-500 hover:text-red-700 p-4 text-xl";
    deleteButtonModal.addEventListener('click', async () => {
        if (confirm("Are you sure you want to delete this video?")) {
            const memoryId = video.dataset.memoryId;
            const deleted = await deleteMemory(memoryId);
            if (deleted) {
                video.remove();
                modal.remove();
                if (videoGrid.children.length === 0) {
                    removeVideoEmptyMessage.classList.remove('hidden');
                    addMoreVideos.classList.add('hidden');
                }
            } else {
                alert("Failed to delete memory.");
            }
        }
    });
    header.appendChild(deleteButtonModal);

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.className = "text-gray-600 hover:text-gray-800 p-4 text-xl";
    closeButton.addEventListener('click', () => modal.remove());
    header.appendChild(closeButton);

    modalContent.appendChild(header);

    const modalVideo = document.createElement('video');
    modalVideo.src = data.src;
    modalVideo.controls = true;
    modalVideo.className = "w-full h-auto rounded mb-4";
    modalContent.appendChild(modalVideo);

    const description = document.createElement('p');
    description.innerText = data.description;
    description.className = "text-gray-700 mb-4";
    modalContent.appendChild(description);

    const tags = document.createElement('p');
    tags.innerText = `Tags: ${data.tags}`;
    tags.className = "text-gray-700 mb-4";
    modalContent.appendChild(tags);

    const geolocation = document.createElement('p');
    geolocation.innerText = `Location: ${data.geolocation.location.address.city}, ${data.geolocation.location.address.country}`;
    geolocation.className = "text-gray-500 mb-4";
    modalContent.appendChild(geolocation);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

window.addEventListener("DOMContentLoaded", async () => {
    const memberUserId = 1;
    const familyId = 1;
    const memories = await fetchFamilyMemberMemories(memberUserId, familyId);
    if (memories && memories.length > 0) {
        removeVideoEmptyMessage.classList.add("hidden");
        addMoreVideos.classList.remove("hidden");
    }
    memories.forEach((memory) => {
        const video = document.createElement("video");
        video.src = memory.file_url;
        video.dataset.videoId = memory.cloudinary_id;
        video.dataset.memoryId = memory.id;
        video.controls = true;
        video.className = "max-w-full h-auto rounded shadow cursor-pointer";
        video.addEventListener("click", async () => {
            const data = await getVideoData(video.dataset.videoId);
            modal(video, data);
        });
        videoGrid.appendChild(video);
    });
});

fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "digital_family_vault");

    try {
        const upload_cloudinary = await fetch(`https://api.cloudinary.com/v1_1/dz7lbivvf/video/upload`, {
            method: "POST",
            body: formData
        });

        const result = await upload_cloudinary.json();

        if (result.secure_url) {
            const videoURL = result.secure_url;
            const publicID = result.public_id;

            console.log("Upload successful", videoURL, publicID);

            const location = await getLocation();

            await uploadMemory({
                location,
                file_url: videoURL,
                cloudinary_id: publicID,
                tags: "sample, test",
                family_id: 1
            });

            removeVideoEmptyMessage.classList.add("hidden");
            addMoreVideos.classList.remove("hidden");

            const video = document.createElement("video");
            video.src = videoURL;
            video.dataset.videoId = publicID;
            video.controls = true;
            video.className = "max-w-full h-auto rounded shadow cursor-pointer";

            video.addEventListener('click', async () => {
                const data = await getVideoData(video.dataset.videoId);
                modal(video, data);
            });
            videoGrid.appendChild(video);

        } else {
            alert("Upload failed. No secure_url returned.");
            console.error(result);
        }
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        alert("Upload failed. Check console for details.");
    }
});
