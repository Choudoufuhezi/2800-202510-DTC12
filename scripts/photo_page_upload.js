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

//  Comment fetch APIs 
async function getComments(imageId) {
    return [
        { user: "Alice", text: "Nice shot!" },
        { user: "Bob", text: "Great view." }
    ];
}

// Image Data API 
async function getImageData(memory) {
    const element = document.querySelector(`[data-image-id="${memory.cloudinary_id}"]`);
    const src = element?.getAttribute("src") || element?.src || memory.file_url;

    const location = await getLocation();
    return {
        src,
        description: "This is a sample description for the image.",
        tags: memory.tags,
        geolocation: { location }
    };
}

// Comment posting API
async function postComment(imageId, text) {
    console.log(`(faked) POST comment "${text}" for image ${imageId}`);
    return { success: true };
}

async function uploadMemory({ location, file_url, cloudinary_id, tags, family_id }) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch("http://localhost:8000/memories/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                location,
                tags,
                file_url,
                cloudinary_id,
                family_id
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

function modal(img, data) {
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
        const comments = await getComments(img.dataset.imageId);
        commentsList.innerHTML = "";
        comments.forEach((c, index) => {
            const commentItem = document.createElement('div');
            commentItem.className = "flex justify-between items-center mb-1";

            const commentText = document.createElement('p');
            commentText.className = "text-gray-800";
            commentText.innerText = `${c.user}: ${c.text}`;
            commentItem.appendChild(commentText);

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.className = "text-red-500 hover:text-red-700 ml-2";
            deleteButton.addEventListener('click', async () => {
                await deleteComment(img.dataset.imageId, index);
                await loadComments();
            });
            commentItem.appendChild(deleteButton);

            commentsList.appendChild(commentItem);
        });
    }

    commentForm.addEventListener('submit', async e => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;
        console.log(`(faked) POST comment "${text}" for image ${img.dataset.imageId}`);
        commentInput.value = "";
    });

    loadComments();
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
};

window.addEventListener("DOMContentLoaded", async () => {
    const memberUserId = 1; // replace with dynamic logic
    const familyId = 1; // replace with dynamic logic
    const memories = await fetchFamilyMemberMemories(memberUserId, familyId);
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
                const data = await getImageData(memory);
                modal(element, data);
            });

            wrapper.appendChild(element);
            wrapper.appendChild(overlay);
            photoGrid.appendChild(wrapper);
        } else {
            element.classList.add("w-full", "h-auto", "rounded", "cursor-pointer");
            element.addEventListener("click", async () => {
                const data = await getImageData(memory);
                modal(element, data);
            });

            photoGrid.appendChild(element);
        }
    });
});

// Uploading image to Cloudinary
fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

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
                tags: "sample, test",
                family_id: 1
            });

            if (!uploadedMemory) {
                alert("Memory upload failed.");
                return;
            }

            removePhotoEmptyMessage.classList.add("hidden");
            addMorePhotos.classList.remove("hidden");

            const isPdf = file.type === "application/pdf";
            const element = isPdf ? document.createElement("iframe") : document.createElement("img");

            element.src = imageURL;
            element.dataset.imageId = publicID;
            element.dataset.memoryId = uploadedMemory.id;
            element.className = "w-full rounded";
            if (isPdf) {
                element.style.height = "250px";
                element.style.width = "100%";

                // Create overlay for iframe
                const overlay = document.createElement("div");
                overlay.className = "absolute inset-0 cursor-pointer bg-transparent z-10";
                overlay.addEventListener("click", async () => {
                    const data = await getImageData(uploadedMemory);
                    modal(element, data);
                });

                // Wrap iframe + overlay
                const wrapper = document.createElement("div");
                wrapper.className = "relative w-full";
                wrapper.appendChild(element);
                wrapper.appendChild(overlay);
                photoGrid.appendChild(wrapper);

            } else {
                element.addEventListener("click", async () => {
                    const data = await getImageData(uploadedMemory);
                    modal(element, data);
                });
                photoGrid.appendChild(element);
            }

        } else {
            alert("Upload failed. No secure_url returned.");
            console.error(result);
        }

    } catch (error) {
        console.error("Cloudinary upload error:", error);
        alert("Upload failed. Check console for details.");
    }
});
