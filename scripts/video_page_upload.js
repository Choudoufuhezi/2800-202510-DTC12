import { getLocation } from './geolocation.js';
import { API_URL } from './config.js';

const removeVideoEmptyMessage = document.getElementById("videoEmptyMessage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const videoGrid = document.getElementById("videoGrid");
const addMoreVideos = document.getElementById("addMoreVideosButton");
let memories = [];
let familyMembers = [];

uploadButton.addEventListener("click", () => {
    fileInput.click();
});

addMoreVideos.addEventListener('click', () => {
    fileInput.click();
});


async function getComments(memoryID) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/comments/memory/${memoryID}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to fetch comments:", error);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching comments:", error);
        return null;
    }
}

async function getVideoData(memory) {
    const element = document.querySelector(`[data-video-id="${memory.cloudinary_id}"]`);
    const src = element?.getAttribute("src") || element?.src || memory.file_url;
    const location = await getLocation();
    return {
        src,
        description: memory.description?.trim() || "Add description",
        tags: memory.tags?.trim() || "Add tags",
        geolocation: { location }
    };
}

async function postComment(memoryId, text) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/comments/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                memory_id: memoryId,
                comment_text: text
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to post comment:", error);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Error posting comment:", error);
        return null;
    }
}

async function deleteComment(commentId) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to delete comment:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error deleting comment:", error);
        return false;
    }
}

async function uploadMemory({ location, file_url, cloudinary_id, family_id, tags, description }) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/memories`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ location, file_url, cloudinary_id, family_id, tags, description })
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
        const response = await fetch(`${API_URL}/memories/member/${memberUserId}/family/${familyId}`, {
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
        const allMemories = await response.json();

        const memories = allMemories.filter(memory => {
            const isVideo = memory.resource_type === "video";
            return isVideo;
        });

        return memories
    } catch (error) {
        console.error("Error fetching family member memories:", error);
        return null;
    }
}

async function deleteMemory(memoryId) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/memories/${memoryId}`, {
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

async function updateMemory(memoryId, { tags, description }) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_URL}/memories/${memoryId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ tags, description })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to update memory:", error);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating memory:", error);
        return null;
    }
}

function createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = "flex items-center justify-center py-12";
    spinner.innerHTML = `
      <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <span class="ml-4 text-gray-500">Loading...</span>
    `;
    return spinner;
}

async function modal(video, memory) {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50";
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const modalContent = document.createElement('div');
    modalContent.className = "bg-white pt-2 pb-6 px-6 rounded shadow-lg max-w-md w-full";
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const spinner = createSpinner();
    modalContent.appendChild(spinner);

    let data;
    try {
        data = await getVideoData(memory);
    } catch (e) {
        spinner.innerHTML = `<span class="text-red-500">Failed to load video data.</span>`;
        return;
    }

    modalContent.innerHTML = '';

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

    let modalVideo;
    const videoWrapper = document.createElement('div');
    videoWrapper.className = "w-full max-h-[400px] overflow-y-auto mb-4 rounded";

    modalVideo = document.createElement('video');
    modalVideo.src = data.src;
    modalVideo.className = "w-full h-auto block";

    videoWrapper.appendChild(modalVideo)
    modalContent.appendChild(videoWrapper);

    const description = document.createElement('textarea');
    description.value = data.description || "";
    description.className = "w-full p-2 mb-2 border rounded resize-none";
    description.disabled = true;
    modalContent.appendChild(description);

    const tags = document.createElement('input');
    tags.value = data.tags || "";
    tags.className = "w-full p-2 mb-4 border rounded";
    tags.disabled = true;
    modalContent.appendChild(tags);

    const editButton = document.createElement('button');
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.className = "bg-sky-400 text-white px-2 py-1 hover:bg-sky-300 rounded mr-2 mb-4";
    modalContent.appendChild(editButton);

    editButton.addEventListener('click', () => {
        description.disabled = false;
        tags.disabled = false;
        saveButton.classList.remove("hidden");
        editButton.classList.add("hidden");
    });

    const saveButton = document.createElement('button');
    saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
    saveButton.className = "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 hidden";
    modalContent.appendChild(saveButton);

    saveButton.addEventListener('click', async () => {
        const memoryId = video.dataset.memoryId;
        const updated = await updateMemory(memoryId, {
            tags: tags.value.trim(),
            description: description.value.trim()
        });

        if (updated) {
            description.disabled = true;
            tags.disabled = true;
            alert("Memory updated successfully!");
            saveButton.classList.add("hidden");
            editButton.classList.remove("hidden");

            const memory = memories.find(m => m.id == memoryId);
            if (memory) {
                memory.tags = tags.value.trim();
                memory.description = description.value.trim();
            }
        } else {
            alert("Failed to update memory.");
        }
    });


    const geolocation = document.createElement('p');
    geolocation.innerText = `Location: ${data.geolocation.location.address.city}, ${data.geolocation.location.address.country}`;
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
    commentSubmit.className = "bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 rounded";
    commentForm.appendChild(commentInput);
    commentForm.appendChild(commentSubmit);
    commentsSection.appendChild(commentForm);

    modalContent.appendChild(commentsSection);

    async function loadComments() {
        const comments = await getComments(video.dataset.memoryId);
        commentsList.innerHTML = "";

        commentsList.classList.remove('max-h-40', 'max-h-24', 'overflow-auto');

        if (!comments) {
            commentsList.innerHTML = "<p class='text-red-500'>Could not load comments.</p>";
            return;
        }

        if (comments.length > 3) {
            commentsList.classList.add('max-h-24', 'overflow-auto');
        }

        if (comments.length === 0) {
            commentsList.innerHTML = "<p class='text-gray-500 italic'>No comments yet.</p>";
        } else {
            comments.forEach((c, index) => {
                const familyMember = familyMembers.find(member => member.user_id === c.user_id);
                const userName = familyMember ?
                    (familyMember.custom_name ? familyMember.custom_name : familyMember.email)
                    : `User ${c.user_id}`;

                const commentItem = document.createElement('div');
                commentItem.className = "flex justify-between items-center mb-1";

                const commentText = document.createElement('p');
                commentText.className = "text-gray-800";
                commentText.innerText = `${userName}: ${c.comment_text}`;
                commentItem.appendChild(commentText);

                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.className = "text-red-500 hover:text-red-700 ml-2";
                deleteButton.addEventListener('click', async () => {
                    const deleted = await deleteComment(c.id);
                    if (deleted) await loadComments();
                });
                commentItem.appendChild(deleteButton);

                commentsList.appendChild(commentItem);
            });
        }
    }

    commentForm.addEventListener('submit', async e => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;

        const posted = await postComment(video.dataset.memoryId, text);
        if (posted) {
            commentInput.value = "";
            await loadComments();
        } else {
            alert("Failed to post comment");
        }
    });

    loadComments();
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

window.addEventListener("DOMContentLoaded", async () => {
    if (!localStorage.getItem('token')) {
        window.location.href = `${API_URL}/login.html`;
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    const memberUserId = urlParams.get('userId');
    if (!familyId || !memberUserId) {
        console.error("Missing familyId or userId in URL");
        window.location.href = `${API_URL}/index.html`;
        return;
    }

    familyMembers = await getFamilyMembers();
    memories = await fetchFamilyMemberMemories(memberUserId, familyId);
    if (memories && memories.length > 0) {
        removeVideoEmptyMessage.classList.add("hidden");
        addMoreVideos.classList.remove("hidden");
    }
    if (!memories || memories.length === 0) return;
    memories.forEach((memory) => {
        const wrapper = document.createElement("div");
        wrapper.className = "";
        const element = document.createElement("video");
        element.src = memory.file_url;
        element.dataset.videoId = memory.cloudinary_id;
        element.dataset.memoryId = memory.id;
        element.className = "w-full h-auto";

        element.style.border = "none";
        element.classList.add("w-full", "h-auto", "rounded", "cursor-pointer");
        element.addEventListener("click", async () => {
            const memoryId = element.dataset.memoryId;
            const latestMemory = memories.find(m => m.id == memoryId);
            modal(element, latestMemory);
        });

        videoGrid.appendChild(element);
    });
});

fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    const closeUploadingModal = showBasicUploadingModal();

    const maxSizeMB = 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`video size cannot be larger than${maxSizeMB}MB`);
        fileInput.value = "";
        return;
    }

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
            const location = await getLocation();

            const uploadedMemory = await uploadMemory({
                location,
                file_url: videoURL,
                cloudinary_id: publicID,
                family_id: familyId,
                tags: "Add tags",
                description: "Add description"
            });

            if (!uploadedMemory) {
                closeUploadingModal();
                alert("Memory upload failed.");
                return;
            }

            closeUploadingModal();

            removeVideoEmptyMessage.classList.add("hidden");
            addMoreVideos.classList.remove("hidden");
            window.location.reload();
        } else {
            closeUploadingModal();
            alert("Upload failed. No secure_url returned.");
            console.error(result);
        }

    } catch (error) {
        closeUploadingModal();
        console.error("Cloudinary upload error:", error);
        alert("Upload failed. Check console for details.");
    }
});

async function getFamilyMembers() {
    if (!localStorage.getItem('token')) {
        window.location.href = `${API_URL}/login.html`;
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    if (!familyId) {
        window.location.href = `${API_URL}/login.html`;
        return;
    }

    const response = await fetch(`${API_URL}/family/${familyId}/members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
            window.location.href = `${API_URL}/login.html`;
            throw new Error('Unauthorized: Please log in again');
        }
        if (response.status === 403) {
            throw new Error('You are not a member of this family');
        }
        throw new Error(errorData.detail || 'Failed to fetch family members');
    }

    const family = await response.json();

    return family.members;
}

function showBasicUploadingModal() {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50";
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const modalContent = document.createElement('div');
    modalContent.className = "modal-content bg-white pt-2 pb-6 px-6 rounded shadow-lg max-w-md w-full flex flex-col items-center"; // Fixed unterminated string
    modal.appendChild(modalContent);

    const spinner = document.createElement('div');
    spinner.className = "animate-spin h-8 w-8 text-gray-400";
    spinner.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
    `;

    const message = document.createElement('span');
    message.className = "ml-4 text-gray-500";
    message.innerText = "Uploading video, please wait...";

    modalContent.appendChild(spinner);
    modalContent.appendChild(message);

    document.body.appendChild(modal);

    return () => {
        modal.remove();
    };
}
