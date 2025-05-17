import { API_URL, BASE_URL } from './config.js';

const urlParams = new URLSearchParams(window.location.search);
const rawFamilyId = urlParams.get('familyId');
const familyId = parseInt(rawFamilyId, 10);

const familyNameElement = document.getElementById('family-name');
const membersContainer = document.getElementById('members-container');
const inviteButton = document.getElementById('invite-button');
const errorMessage = document.getElementById('error-message');

console.log('Family ID from URL:', familyId);

if (!localStorage.getItem('token')) {
    console.log('No token found, redirecting to login');
    window.location.href = `${BASE_URL}/login.html`;
}

async function loadFamilyDetails() {
    console.log('Loading family details...');
    membersContainer.innerHTML = `
        <div class="flex justify-center">
            <svg class="animate-spin h-5 w-5 text-sky-600" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8z"></path>
            </svg>
        </div>`;
    errorMessage.classList.add('hidden');

    try {
        if (isNaN(familyId)) throw new Error('Invalid family ID');

        const response = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                window.location.href = `${BASE_URL}/login.html`;
                throw new Error('Unauthorized: Please log in again');
            }
            if (response.status === 403) {
                throw new Error('You are not a member of this family');
            }
            throw new Error(errorData.detail || 'Failed to fetch family members');
        }

        const family = await response.json();
        familyNameElement.textContent = `${family.family_name} – Members`;

        const memoriesResponse = await fetch(`${API_URL}/memories/${familyId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        const memories = await memoriesResponse.json();

        if (!Array.isArray(memories)) {
            console.error('Memories response is not an array:', memories);
            throw new Error('Failed to fetch valid memory list');
        }

        const memoriesByUser = {};

        memories.forEach(memory => {
            if (memory.tags !== 'Photos') return;
            if (!memoriesByUser[memory.user_id]) memoriesByUser[memory.user_id] = [];
            if (memoriesByUser[memory.user_id].length < 3) {
                memoriesByUser[memory.user_id].push(memory);
            }
        });

        membersContainer.innerHTML = '';

        if (!family.members || family.members.length === 0) {
            membersContainer.innerHTML = '<p class="text-gray-600">No members found. Invite someone!</p>';
            return;
        }

        for (const member of family.members) {
            const memberMemories = memoriesByUser[member.user_id] || [];

            const memberCard = document.createElement('div');
            memberCard.className = 'block bg-white p-4 rounded-xl shadow hover:shadow-md transition';

            memberCard.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <a 
                            href="member-categories.html?userId=${member.user_id}&familyId=${familyId}" 
                            class="text-lg font-semibold text-sky-700 hover:underline">
                            ${member.custom_name || member.email}
                        </a>
                        <p class="text-sm text-gray-500">
                            ${member.relationship || (member.is_admin ? 'Admin' : 'Member')}
                        </p>
                    </div>
                </div>
                <div class="mt-2">
                    <h4 class="text-sm font-medium text-gray-700">Recent Photos:</h4>
                    ${memberMemories.length > 0 ? `
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            ${memberMemories.map(memory => `
                                <img src="${memory.file_url}" alt="Photo memory" class="w-full h-24 object-cover rounded-lg" />
                            `).join('')}
                        </div>
                    ` : '<p class="text-sm text-gray-600">No recent photos</p>'}
                </div>
            `;

            membersContainer.appendChild(memberCard);
        }

    } catch (error) {
        console.error('Error in family-members.js:', error);
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
        membersContainer.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFamilyDetails();

    inviteButton.addEventListener('click', () => {
        window.location.href = `${BASE_URL}/manage-members.html?familyId=${familyId}`;
    });
});
