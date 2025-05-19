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
        window.location.href = `${BASE_URL}/login.html`;
        return;
    }

    if (!familyId) {
        errorMessage.textContent = 'No family ID provided';
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
        return;
    }

    try {
        // Step 1: Fetch Family Details
        const familyResponse = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
        });

        if (!familyResponse.ok) {
            if (familyResponse.status === 401) window.location.href = `${BASE_URL}/login.html`;
            if (familyResponse.status === 403) throw new Error('You are not a member of this family');
            const errorData = await familyResponse.json();
            throw new Error(errorData.detail || 'Failed to fetch family details');
        }

        const family = await familyResponse.json();
        const familyName = family?.family_name || 'this family';
        familyDescription.textContent = `Invite someone to join ${familyName}`;

        // Step 2: Create Invite
        const inviteResponse = await fetch(`${API_URL}/family/create-invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                family_id: parseInt(familyId),
                expires_in_hours: 24,
                max_uses: 1
            }),
        });

        if (!inviteResponse.ok) {
            if (inviteResponse.status === 401) window.location.href = `${BASE_URL}/login.html`;
            if (inviteResponse.status === 403) throw new Error('Only family admins can create invites');
            const errorData = await inviteResponse.json();
            throw new Error(errorData.detail || 'Failed to create invite');
        }

        const invite = await inviteResponse.json();

        // Step 3: Display Invite Info
        codeElement.textContent = invite.code;
        inviteLinkElement.textContent = invite.invite_link || 'Link not available';

        const expiresAt = new Date(invite.expires_at);
        const now = new Date();
        const minutesLeft = Math.max(1, Math.round((expiresAt - now) / 60000));
        expiresInElement.textContent = `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;

        // Set back button destination
        backToMembersButton.href = `${BASE_URL}/family-members.html?familyId=${familyId}`;

        // Show content
        loading.classList.add('hidden');
        inviteContent.classList.remove('hidden');
    } catch (error) {
        console.error('Error in manage-members.js:', error);
        errorMessage.textContent = error.message || 'Something went wrong';
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
    }

    // Clipboard copy buttons
    copyCodeButton?.addEventListener('click', () => {
        navigator.clipboard.writeText(codeElement.textContent)
            .then(() => alert('Code copied to clipboard!'))
            .catch(() => alert('Failed to copy code'));
    });

    copyLinkButton?.addEventListener('click', () => {
        navigator.clipboard.writeText(inviteLinkElement.textContent)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => alert('Failed to copy link'));
    });
});
