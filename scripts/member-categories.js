import { API_URL, BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    const userId = urlParams.get('userId');

    const familyNameElement = document.getElementById('family-name');
    const errorMessage = document.getElementById('error-message');
    const loading = document.getElementById('loading');
    const backButton = document.getElementById('back-to-members');
    const photoSection = document.getElementById('photo-section');
    const recipesSection = document.getElementById('recipes-section');
    const videosSection = document.getElementById('videos-section');

    if (!localStorage.getItem('token')) {
        window.location.href = `${BASE_URL}/login.html`;
        return;
    }

    if (!familyId || !userId || !/^\d+$/.test(familyId) || !/^\d+$/.test(userId)) {
        errorMessage.textContent = 'Missing or invalid family or user ID';
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
        return;
    }

    photoSection.innerHTML =
        `<a href="photos.html?userId=${userId}&familyId=${familyId}" aria-label="View Photos category"
        class="block bg-white rounded-xl p-6 shadow hover:shadow-md transition hover:bg-indigo-50">
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-lg font-semibold text-gray-800">Photos</h2>
            </div>
            <i class="fas fa-chevron-right text-indigo-600"></i>
        </div>
    </a>`;

    videosSection.innerHTML =
        `<a href="videos.html?userId=${userId}&familyId=${familyId}" aria-label="View Photos category"
        class="block bg-white rounded-xl p-6 shadow hover:shadow-md transition hover:bg-indigo-50">
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-lg font-semibold text-gray-800">Videos</h2>
            </div>
            <i class="fas fa-chevron-right text-indigo-600"></i>
        </div>
    </a>`;


    recipesSection.innerHTML =
        `<a href="recipes.html?userId=${userId}&familyId=${familyId}" aria-label="View Recipes category"
            class="block bg-white rounded-xl p-6 shadow hover:shadow-md transition hover:bg-indigo-50">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-lg font-semibold text-gray-800">Recipes</h2>
                </div>
                <i class="fas fa-chevron-right text-indigo-600"></i>
            </div>
        </a>`;
    backButton.href = `family-members.html?familyId=${familyId}`;

    try {
        // Fetch all memories for the selected member
        const response = await fetch(`${API_URL}/memories/member/${userId}/family/${familyId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = `${BASE_URL}/login.html`;
                return;
            }
            throw new Error('Failed to load member memories');
        }

        const memories = await response.json();

        // Group by tag
        const tags = ['Photos', 'Videos', 'Recipes', 'Stories'];
        const grouped = {};

        tags.forEach(tag => grouped[tag] = []);
        memories.forEach(mem => {
            if (grouped[mem.tags]) {
                grouped[mem.tags].push(mem);
            }
        });

        // Update header
        familyNameElement.textContent = `Categories for Member #${userId}`;

        // Optional: log for debug
        console.log('Grouped memories:', grouped);

        loading.classList.add('hidden');

    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = error.message || 'Something went wrong';
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
    }
});
