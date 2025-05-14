import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('join-form');
    const codeInput = document.getElementById('inviteCode');
    const clearButton = document.getElementById('clear-code');
    const errorMessage = document.getElementById('error-message');
    const expiresElement = document.getElementById('expires-in');
    const linkButton = document.getElementById('use-link');
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('code');

    if (inviteCode) {
        codeInput.value = inviteCode;
    }

    if (inviteCode) {
        fetch(`${API_URL}/family/invite/${inviteCode}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        })
            .then(response => {
                if (!response.ok) throw new Error('Invalid invite code');
                return response.json();
            })
            .then(data => {
                const expiresAt = new Date(data.expires_at);
                const now = new Date();
                const hoursLeft = Math.round((expiresAt - now) / (1000 * 60 * 60));
                expiresElement.textContent = `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
            })
            .catch(error => {
                console.error('Error validating invite code:', error);
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('hidden');
            });
    }

    clearButton.addEventListener('click', () => {
        codeInput.value = '';
        codeInput.focus();
        errorMessage.classList.add('hidden');
        expiresElement.textContent = '24 hours';
    });

    linkButton.addEventListener('click', () => {
        window.location.href = '/invite.html';
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!localStorage.getItem('token')) {
            window.location.href = '/login.html';
            return;
        }

        const code = codeInput.value.trim();
        if (!/^\d{6}$/.test(code)) {
            errorMessage.textContent = 'Please enter a valid 6-digit code';
            errorMessage.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/family/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                if (response.status === 401) window.location.href = '/login.html';
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to join family');
            }

            const data = await response.json();
            window.location.href = `family-members.html?familyId=${data.id}`;
        } catch (error) {
            console.error('Error joining family:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
});