// manage-members.js
import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    const familyNameElement = document.getElementById('family-name');
    const membersContainer = document.getElementById('members-container');
    const invitesContainer = document.getElementById('invites-container');
    const createInviteButton = document.getElementById('create-invite');
    const errorMessage = document.getElementById('error-message');

    if (!localStorage.getItem('token')) {
        window.location.href = '/login.html';
        return;
    }

    if (!familyId) {
        errorMessage.textContent = 'No family ID provided';
        errorMessage.classList.remove('hidden');
        return;
    }

    async function loadMembersAndInvites() {
        try {
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
            familyNameElement.textContent = `${family.family_name} – Manage Members`;
            membersContainer.innerHTML = '';

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

            const invitesResponse = await fetch(`${API_URL}/family/${familyId}/invites`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            });

            if (!invitesResponse.ok) {
                throw new Error('Failed to fetch invites');
            }

            const invites = await invitesResponse.json();
            invitesContainer.innerHTML = '';

            if (invites.length === 0) {
                invitesContainer.innerHTML = '<p class="text-gray-600">No active invites.</p>';
            } else {
                invites.forEach(invite => {
                    const inviteCard = document.createElement('div');
                    inviteCard.className = 'bg-white p-4 rounded-xl shadow';
                    inviteCard.innerHTML = `
                        <p class="text-sm text-gray-800">Code: ${invite.code}</p>
                        <p class="text-sm text-gray-500">Expires: ${new Date(invite.expires_at).toLocaleString()}</p>
                        <p class="text-sm text-gray-500">Max Uses: ${invite.max_uses}</p>
                    `;
                    invitesContainer.appendChild(inviteCard);
                });
            }
        } catch (error) {
            console.error('Error loading data:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    }

    createInviteButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_URL}/family/create-invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ family_id: parseInt(familyId), expires_in_hours: 24, max_uses: 1 }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.html';
                    throw new Error('Unauthorized');
                }
                throw new Error('Failed to create invite');
            }

            const invite = await response.json();
            window.location.href = `/join-link.html?code=${invite.code}`;
        } catch (error) {
            console.error('Error creating invite:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });

    await loadMembersAndInvites();
});