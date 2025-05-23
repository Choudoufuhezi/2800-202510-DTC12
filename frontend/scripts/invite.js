import { API_URL, BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('join-link-form');
    const linkInput = document.getElementById('inviteLink');
    const errorMessage = document.getElementById('error-message');
    const description = document.getElementById('description');

    if (!localStorage.getItem('token')) {
        window.location.href = `${BASE_URL}/login.html`;
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('hidden');

        try {
            const url = new URL(linkInput.value.trim());
            const code = url.searchParams.get('code');
            if (!code || !/^\d{6}$/.test(code)) {
                throw new Error('Invalid invitation link format');
            }

            const response = await fetch(`${API_URL}/family/invite/${code}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = `${BASE_URL}/login.html`;
                    throw new Error('Unauthorized');
                }
                if (response.status === 404) {
                    throw new Error('Invalid or expired invite code');
                }
                if (response.status === 400) {
                    throw new Error('Invite expired or used');
                }
                throw new Error('Failed to validate invite');
            }

            const invite = await response.json();
            description.textContent = `Join ${invite.family_name} using this invitation link`;

            // Directly join the family
            const joinResponse = await fetch(`${API_URL}/family/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ code }),
            });

            if (!joinResponse.ok) {
                if (joinResponse.status === 401) {
                    window.location.href = `${BASE_URL}/login.html`;
                    throw new Error('Unauthorized');
                }
                const errorData = await joinResponse.json();
                throw new Error(errorData.detail || 'Failed to join family');
            }

            const data = await joinResponse.json();
            window.location.href = `${BASE_URL}/family-members.html?familyId=${data.id}`;
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
});