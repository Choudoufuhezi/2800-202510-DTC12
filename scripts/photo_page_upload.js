import { getLocation } from './geolocation.js';
import { API_URL } from './config.js';

const removePhotoEmptyMessage = document.getElementById("photoEmptyMessage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const photoGrid = document.getElementById("photoGrid");
const addMorePhotos = document.getElementById("addMorePhotosButton");
let memories = [];

uploadButton.addEventListener("click", () => {
    fileInput.click();
});

addMorePhotos.addEventListener('click', () => {
    fileInput.click();
});

//  Comment fetch APIs 
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

// Image Data API 
async function getImageData(memory) {
    const element = document.querySelector(`[data-image-id="${memory.cloudinary_id}"]`);
    const src = element?.getAttribute("src") || element?.src || memory.file_url;
    console.log(memory);
    const location = await getLocation();
    return {
        src,
        description: memory.description?.trim() || "Add description",
        tags: memory.tags?.trim() || "Add tags",
        geolocation: { location }
    };
}

// Comment posting API
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
        const response = await fetch(`${API_URL}/memories/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                location,
                file_url,
                cloudinary_id,
                family_id,
                tags,
                description
            })
        });

        if (!response.ok) {
            const errorText = await response.json();
            console.error("Failed to upload memory:", errorText);
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
        const response = await fetch(`${API_URL}/memories/${memoryId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to delete memory:", error);
            return false;
        }
        return true;
    }
    catch (error) {
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

async function modal(img, memory) {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50";
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    const modalContent = document.createElement('div');
    modalContent.className = "bg-white pt-2 pb-6 px-6 rounded shadow-lg max-w-md w-full";
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add a spinner while loading
    const spinner = createSpinner();
    modalContent.appendChild(spinner);

    // Fetch image data (takes time!)
    let data;
    try {
        data = await getImageData(memory);
    } catch (e) {
        spinner.innerHTML = `<span class="text-red-500">Failed to load image data.</span>`;
        return;
    }

    // Remove the spinner
    modalContent.innerHTML = '';

    const header = document.createElement('div');
    header.className = "flex justify-between items-center";

    const deleteButtonModal = document.createElement('button');
    deleteButtonModal.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButtonModal.className = "text-red-500 hover:text-red-700 p-4 text-xl";
    deleteButtonModal.addEventListener('click', async () => {
        if (confirm("Are you sure you want to delete this photo?")) {
            const memoryId = img.dataset.memoryId;
            const deleted = await deleteMemory(memoryId);
            if (deleted) {
                img.remove();
                modal.remove();
                if (photoGrid.children.length === 0) {
                    removePhotoEmptyMessage.classList.remove('hidden');
                    addMorePhotos.classList.add('hidden');
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

    let contentElement;
    const isPdf = data.src.toLowerCase().endsWith('.pdf');

    if (isPdf) {
        contentElement = document.createElement('iframe');
        contentElement.src = data.src;
        contentElement.type = "application/pdf";
        contentElement.className = "w-full rounded mb-4";
        contentElement.style.height = "500px";
        contentElement.style.minHeight = "500px";
        contentElement.style.width = "100%";
        contentElement.setAttribute("frameborder", "0");
        contentElement.setAttribute("allowfullscreen", "true");

    } else {
        contentElement = document.createElement('img');
        contentElement.src = data.src;
        contentElement.className = "w-full h-auto rounded mb-4";
    }
    modalContent.appendChild(contentElement);

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
        console.log('edit button clicked')
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
        const memoryId = img.dataset.memoryId;
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
    commentInput.placeholder = "Add a comment";
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
        const comments = await getComments(img.dataset.memoryId);
        commentsList.innerHTML = "";
        comments.forEach((c, index) => {
            const commentItem = document.createElement('div');
            commentItem.className = "flex justify-between items-center mb-1";

            const commentText = document.createElement('p');
            commentText.className = "text-gray-800";
            commentText.innerText = `User ${c.user_id}: ${c.comment_text}`;
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

    commentForm.addEventListener('submit', async e => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;

        const posted = await postComment(img.dataset.memoryId, text);
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
};

window.addEventListener("DOMContentLoaded", async () => {
    const memberUserId = 1; // replace with dynamic logic
    const familyId = 1; // replace with dynamic logic
    memories = await fetchFamilyMemberMemories(memberUserId, familyId);
    if (memories && memories.length > 0) {
        removePhotoEmptyMessage.classList.add("hidden");
        addMorePhotos.classList.remove("hidden");
    }
    if (!memories || memories.length === 0) return;
    memories.forEach((memory) => {
        const isPdf = memory.file_url.toLowerCase().endsWith(".pdf");

        const wrapper = document.createElement("div");
        wrapper.className = isPdf ? "relative w-full rounded" : "";

        const element = isPdf
            ? document.createElement("iframe")
            : document.createElement("img");

        element.src = memory.file_url;
        element.dataset.imageId = memory.cloudinary_id;
        element.dataset.memoryId = memory.id;
        element.className = isPdf ? "w-full h-auto rounded" : "w-full h-auto";
        element.style.border = "none";

        if (isPdf) {
            element.style.height = "250px";

            const overlay = document.createElement("div");
            overlay.className = "absolute inset-0 z-10 cursor-pointer";
            overlay.style.background = "transparent";

            overlay.addEventListener("click", async () => {
                modal(element, memory);
            });

            wrapper.appendChild(element);
            wrapper.appendChild(overlay);
            photoGrid.appendChild(wrapper);
        } else {
            element.classList.add("w-full", "h-auto", "rounded", "cursor-pointer");
            element.addEventListener("click", async () => {
                const memoryId = element.dataset.memoryId;
                const latestMemory = memories.find(m => m.id == memoryId);
                modal(element, latestMemory);
            });

            photoGrid.appendChild(element);
        }
    });
});

// Uploading image to Cloudinary
fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const closeUploadingModal = showBasicUploadingModal();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "digital_family_vault");

    try {
        const uploadUrl = file.type === "application/pdf"
            ? "https://api.cloudinary.com/v1_1/dz7lbivvf/raw/upload"
            : "https://api.cloudinary.com/v1_1/dz7lbivvf/image/upload";

        const upload_cloudinary = await fetch(uploadUrl, {
            method: "POST",
            body: formData
        });

        const result = await upload_cloudinary.json();

        if (result.secure_url) {
            const imageURL = result.secure_url;
            const publicID = result.public_id;

            console.log("Upload successful");
            console.log("Image URL:", imageURL);
            console.log("Cloudinary ID:", publicID);

            const location = await getLocation();

            const uploadedMemory = await uploadMemory({
                location,
                file_url: imageURL,
                cloudinary_id: publicID,
                tags: "Add tags",
                description: "Add description",
                family_id: 1
            });

            if (!uploadedMemory) {
                closeUploadingModal();
                alert("Memory upload failed.");
                return;
            }

            closeUploadingModal();

            removePhotoEmptyMessage.classList.add("hidden");
            addMorePhotos.classList.remove("hidden");
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

function showBasicUploadingModal() {
    // Modal container
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50";
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Modal content
    const modalContent = document.createElement('div');
    modalContent.className = "modal-content bg-white pt-2 pb-6 px-6 rounded shadow-lg max-w-md w-full flex flex-col items-center";
    modal.appendChild(modalContent);

    // Spinner + message
    modalContent.innerHTML = `
      <div class="flex flex-col items-center py-8">
        <svg class="animate-spin h-8 w-8 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span class="ml-4 text-gray-500">Uploading your memory...</span>
      </div>
    `;
    document.body.appendChild(modal);

    return () => modal.remove();
}