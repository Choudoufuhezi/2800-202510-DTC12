import { API_URL } from './config.js';

const urlParams = new URLSearchParams(window.location.search);
const familyId = urlParams.get('familyId');
const familyNameElement = document.getElementById('family-name');
const membersContainer = document.getElementById('members-container');
const inviteButton = document.getElementById('invite-button');
const errorMessage = document.getElementById('error-message');

if (!localStorage.getItem('token')) {
    window.location.href = '/login.html';
}

async function loadFamilyDetails() {
    membersContainer.innerHTML = '<div class="flex justify-center"><svg class="animate-spin h-5 w-5 text-sky-600" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8z"></path></svg></div>';
    errorMessage.classList.add('hidden');

    try {
        if (!familyId) {
            throw new Error('No family ID provided');
        }

        const response = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                throw new Error('Unauthorized');
            }
            throw new Error('Failed to fetch family members');
        }

        const family = await response.json();
        if (!family.family_name) {
            throw new Error('Family name missing');
        }
        familyNameElement.textContent = `${family.family_name} – Members`;
        membersContainer.innerHTML = '';

        if (family.members.length === 0) {
            membersContainer.innerHTML = '<p class="text-gray-600">No members found. Invite someone!</p>';
            return;
        }

        family.members.forEach(member => {
            const memberCard = document.createElement('div');
            memberCard.className = 'block bg-white p-4 rounded-xl shadow hover:shadow-md transition cursor-pointer';
            memberCard.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${member.email}</h3>
                        <p class="text-sm text-gray-500">${member.is_admin ? 'Admin' : 'Member'}</p>
                    </div>
                    <i class="fas fa-chevron-right text-sky-600"></i>
                </div>
            `;
            memberCard.addEventListener('click', () => {
                window.location.href = `member-categories.html?userId=${encodeURIComponent(member.email)}`;
            });
            membersContainer.appendChild(memberCard);
        });
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
        membersContainer.innerHTML = '';
    }
}

inviteButton.addEventListener('click', () => {
    window.location.href = `manage-members.html?familyId=${familyId}`;
});

document.addEventListener('DOMContentLoaded', loadFamilyDetails);