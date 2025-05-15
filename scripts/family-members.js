import { API_URL, BASE_URL } from './config.js';

const urlParams = new URLSearchParams(window.location.search);
const familyId = urlParams.get('familyId');
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
    membersContainer.innerHTML = '<div class="flex justify-center"><svg class="animate-spin h-5 w-5 text-sky-600" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8z"></path></svg></div>';
    errorMessage.classList.add('hidden');

    try {
        if (!familyId) {
            console.log('No familyId provided in URL');
            throw new Error('No family ID provided');
        }

        // Fetch family members
        console.log('Fetching family members for familyId:', familyId);
        const response = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log('Family fetch failed:', response.status, errorData);
            if (response.status === 401) {
                console.log('Unauthorized, redirecting to login');
                window.location.href = `${BASE_URL}/login.html`;
                throw new Error('Unauthorized: Please log in again');
            }
            if (response.status === 403) {
                throw new Error('You are not a member of this family');
            }
            throw new Error(errorData.detail || 'Failed to fetch family members');
        }

        const family = await response.json();
        console.log('Family data:', family);
        if (!family.family_name) {
            console.log('Family name missing in response');
            throw new Error('Family name missing');
        }
        familyNameElement.textContent = `${family.family_name} – Members`;

        // Fetch recent memories for the family
        console.log('Fetching memories for familyId:', familyId);
        const memoriesResponse = await fetch(`${API_URL}/memories/${familyId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (!memoriesResponse.ok) {
            const errorData = await memoriesResponse.json();
            console.log('Memories fetch failed:', memoriesResponse.status, errorData);
            throw new Error(errorData.detail || 'Failed to fetch memories');
        }
        const memories = await memoriesResponse.json();
        console.log('Memories data:', memories);

        // Group memories by user, only include "Photos" memories
        const memoriesByUser = {};
        memories.forEach(memory => {
            if (memory.tags !== 'Photos') return; // Only include Photos
            if (!memoriesByUser[memory.user_id]) {
                memoriesByUser[memory.user_id] = [];
            }
            if (memoriesByUser[memory.user_id].length < 3) {
                memoriesByUser[memory.user_id].push(memory);
            }
        });
        console.log('Photos memories by user:', memoriesByUser);

        membersContainer.innerHTML = '';

        if (family.members.length === 0) {
            console.log('No members found for this family');
            membersContainer.innerHTML = '<p class="text-gray-600">No members found. Invite someone!</p>';
            return;
        }

        for (const member of family.members) {
            const memberMemories = memoriesByUser[member.user_id] || [];
            console.log(`Rendering member: ${member.email}, with ${memberMemories.length} photos`);
            const memberCard = document.createElement('div');
            memberCard.className = 'block bg-white p-4 rounded-xl shadow hover:shadow-md transition';
            memberCard.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${member.email}</h3>
                        <p class="text-sm text-gray-500">${member.is_admin ? 'Admin' : 'Member'}</p>
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

inviteButton.addEventListener('click', () => {
    console.log('Invite button clicked, redirecting to manage-members.html');
    window.location.href = `${BASE_URL}/manage-members.html?familyId=${familyId}`;
});

document.addEventListener('DOMContentLoaded', loadFamilyDetails);