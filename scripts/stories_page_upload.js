import { getLocation } from './geolocation.js';
import { API_URL, BASE_URL } from './config.js';

const removeStoryEmptyMessage = document.getElementById("storyEmptyMessage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const storyGrid = document.getElementById("storyGrid");
const addMoreStories = document.getElementById("addMoreStoriesButton");
const backButton = document.getElementById("back")

uploadButton.addEventListener("click", () => {
    fileInput.click();
});

addMoreStories.addEventListener('click', () => {
    fileInput.click();
});


backButton.addEventListener('click', () => {
    backPreviousPage()
});

async function backPreviousPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    const userId = urlParams.get('userId');
    if (!familyId || !userId) {
        window.location.href = `${API_URL}/login.html`;
        return;
    }
    window.location.href = `${BASE_URL}/member-categories.html?userId=${userId}&familyId=${familyId}`;
}


fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        addMoreStories.classList.remove('hidden');

        const reader = new FileReader();

        reader.onload = function (event) {
            // Hide empty message
            removeStoryEmptyMessage.classList.add('hidden');

            // Create and style the image
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = "max-w-full h-auto rounded shadow";

            // Add to photo grid
            storyGrid.appendChild(img);
        };

        reader.readAsDataURL(file);
    }

    else {
        if (storyGrid.children.length === 0) {
            removeStoryEmptyMessage.classList.remove('hidden');
        }
    }
});