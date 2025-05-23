import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('join-link-form');
    const linkInput = document.getElementById('inviteLink');
    const errorMessage = document.getElementById('error-message');
    const description = document.getElementById('description');

    if (!localStorage.getItem('token')) {
        window.location.href = '/login.html';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('hidden');

        try {
            const url = new URL(linkInput.value.trim());
            const code = url.searchParams.get('code');
            if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
                throw new Error('Invalid invitation link format');
            }

            const response = await fetch(`${API_URL}/family/invite/${code}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.html';
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
            window.location.href = `invite.html?code=${code}`;
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
});