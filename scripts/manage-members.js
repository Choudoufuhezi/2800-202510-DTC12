import { API_URL, BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    const familyDescription = document.getElementById('family-description');
    const codeElement = document.getElementById('code');
    const inviteLinkElement = document.getElementById('invite-link');
    const expiresInElement = document.getElementById('expires-in');
    const copyCodeButton = document.getElementById('copy-code');
    const copyLinkButton = document.getElementById('copy-link');
    const backToMembersButton = document.getElementById('back-to-members');
    const loading = document.getElementById('loading');
    const inviteContent = document.getElementById('invite-content');
    const errorMessage = document.getElementById('error-message');

    if (!localStorage.getItem('token')) {
        console.log('No token found, redirecting to login');
        window.location.href = `${BASE_URL}/login.html`;
        return;
    }

    if (!familyId) {
        console.log('No family ID provided in URL');
        errorMessage.textContent = 'No family ID provided';
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
        return;
    }

    try {
        console.log('Fetching family details for familyId:', familyId);
        const familyResponse = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (!familyResponse.ok) {
            const errorData = await familyResponse.json();
            console.log('Family fetch failed:', familyResponse.status, errorData);
            if (familyResponse.status === 401) {
                window.location.href = `${BASE_URL}/login.html`;
                throw new Error('Unauthorized: Please log in again');
            }
            if (familyResponse.status === 403) {
                throw new Error('You are not a member of this family');
            }
            throw new Error(errorData.detail || 'Failed to fetch family details');
        }

        const family = await familyResponse.json();
        console.log('Family data:', family);
        familyDescription.textContent = `Invite someone to join ${family.family_name}`;

        console.log('Creating invite for familyId:', familyId);
        const inviteResponse = await fetch(`${API_URL}/family/create-invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ family_id: parseInt(familyId), expires_in_hours: 24, max_uses: 1 }),
        });

        if (!inviteResponse.ok) {
            const errorData = await inviteResponse.json();
            console.log('Invite creation failed:', inviteResponse.status, errorData);
            if (inviteResponse.status === 401) {
                window.location.href = `${BASE_URL}/login.html`;
                throw new Error('Unauthorized: Please log in again');
            }
            if (inviteResponse.status === 403) {
                throw new Error('Only family admins can create invites');
            }
            throw new Error(errorData.detail || 'Failed to create invite');
        }

        const invite = await inviteResponse.json();
        console.log('Invite created:', invite);
        codeElement.textContent = invite.code;
        inviteLinkElement.textContent = invite.invite_link;

        const expiresAt = new Date(invite.expires_at);
        const now = new Date();
        const minutesLeft = Math.round((expiresAt - now) / 1000 / 60);
        expiresInElement.textContent = `${minutesLeft} minutes`;

        backToMembersButton.href = `${BASE_URL}/family-members.html?familyId=${familyId}`;
        console.log('Set redirect to family-members.html with familyId:', familyId);

        loading.classList.add('hidden');
        inviteContent.classList.remove('hidden');

        setTimeout(() => {
            console.log('Auto-redirecting to family-members.html');
            window.location.href = backToMembersButton.href;
        }, 5000);
    } catch (error) {
        console.error('Error in manage-members.js:', error);
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
    }

    copyCodeButton.addEventListener('click', () => {
        navigator.clipboard.writeText(codeElement.textContent)
            .then(() => alert('Code copied to clipboard!'))
            .catch(() => alert('Failed to copy code'));
    });

    copyLinkButton.addEventListener('click', () => {
        navigator.clipboard.writeText(inviteLinkElement.textContent)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => alert('Failed to copy link'));
    });
});