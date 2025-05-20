import { API_URL, BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    const familyDescription = document.getElementById('family-description');
    const codeElement = document.getElementById('code');
    const inviteLinkElement = document.getElementById('invite-link');
    const copyCodeButton = document.getElementById('copy-code');
    const copyLinkButton = document.getElementById('copy-link');
    const backToMembersButton = document.getElementById('back-to-members');
    const loading = document.getElementById('loading');
    const createInviteContainer = document.getElementById('create-invite-container');
    const createInviteBtn = document.getElementById('create-invite-btn');
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

        const invitesResponse = await fetch(`${API_URL}/family/${familyId}/invites`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!invitesResponse.ok) {
            if (invitesResponse.status === 401) window.location.href = `${BASE_URL}/login.html`;
            const errorData = await invitesResponse.json();
            throw new Error(errorData.detail || 'Failed to fetch invites');
        }

        const invites = await invitesResponse.json();

        // only show invites that are not expired and have uses left
        const activeInvites = invites.filter(invite => {
            const expiresAt = new Date(invite.expires_at);
            const now = new Date();
            const isExpired = expiresAt <= now;
            const hasUsesLeft = invite.uses < invite.max_uses;    
            return !isExpired && hasUsesLeft;
        });

        if (activeInvites.length === 0) {
            // No active invites, auto create a new one
            await createNewInvite();
        } else {
            // Show existing invites
            displayInvites(activeInvites);
            createInviteContainer.classList.remove('hidden');
        }

        // Set back button destination
        backToMembersButton.href = `${BASE_URL}/family-members.html?familyId=${familyId}`;

        // Show content
        loading.classList.add('hidden');
    } catch (error) {
        console.error('Error in manage-members.js:', error);
        errorMessage.textContent = error.message || 'Something went wrong';
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
    }

    // Create new invite button handler
    createInviteBtn?.addEventListener('click', async () => {
        try {
            loading.classList.remove('hidden');
            await createNewInvite();
        } catch (error) {
            console.error('Error creating new invite:', error);
            errorMessage.textContent = error.message || 'Failed to create new invite';
            errorMessage.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    });

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

async function createNewInvite() {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');

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
    displayInvite(invite);
}

function displayInvites(invites) {
    const invitesContainer = document.getElementById('invites-container');
    invitesContainer.innerHTML = '';
    invitesContainer.classList.remove('hidden');

    invites.forEach(invite => {
        const inviteElement = createInviteElement(invite);
        invitesContainer.appendChild(inviteElement);
    });
}

function displayInvite(invite) {
    const codeElement = document.getElementById('code');
    const inviteLinkElement = document.getElementById('invite-link');
    const expiresInElement = document.getElementById('expires-in');
    const remainingUsesElement = document.getElementById('remaining-uses');
    const inviteContent = document.getElementById('invite-content');

    codeElement.textContent = invite.code;
    inviteLinkElement.textContent = invite.invite_link || 'Link not available';

    const expiresAt = new Date(invite.expires_at);
    const now = new Date();
    const minutesLeft = Math.max(1, Math.round((expiresAt - now) / 60000));
    expiresInElement.textContent = `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;

    const remainingUses = invite.max_uses - invite.uses;
    remainingUsesElement.textContent = remainingUses;

    inviteContent.classList.remove('hidden');
}

function createInviteElement(invite) {
    const div = document.createElement('div');
    div.className = 'bg-white p-6 rounded-lg shadow';
    
    const expiresAt = new Date(invite.expires_at);
    const now = new Date();
    const minutesLeft = Math.max(1, Math.round((expiresAt - now) / 60000));
    const remainingUses = invite.max_uses - invite.uses;

    // Past invite element generated by deepseek
    div.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <span class="text-2xl font-mono font-bold tracking-wider text-indigo-800">${invite.code}</span>
                <button class="ml-2 text-indigo-600 hover:text-indigo-800 copy-code" data-code="${invite.code}">
                    <i class="far fa-copy"></i>
                </button>
            </div>
            <div class="text-sm text-gray-500">
                <div>Expires in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}</div>
                <div>${remainingUses} use${remainingUses !== 1 ? 's' : ''} remaining</div>
            </div>
        </div>
        <div class="flex items-center bg-gray-100 p-3 rounded-lg">
            <span class="text-sm text-gray-600 truncate flex-grow">${invite.invite_link || 'Link not available'}</span>
            <button class="text-indigo-600 hover:text-indigo-800 ml-2 copy-link" data-link="${invite.invite_link}">
                <i class="far fa-copy"></i>
            </button>
        </div>
    `;

    div.querySelector('.copy-code').addEventListener('click', () => {
        navigator.clipboard.writeText(invite.code)
            .then(() => alert('Code copied to clipboard!'))
            .catch(() => alert('Failed to copy code'));
    });

    div.querySelector('.copy-link').addEventListener('click', () => {
        navigator.clipboard.writeText(invite.invite_link)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => alert('Failed to copy link'));
    });

    return div;
}
