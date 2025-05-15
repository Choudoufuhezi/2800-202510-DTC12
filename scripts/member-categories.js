import { API_URL, BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');
    const familyNameElement = document.getElementById('family-name');
    const errorMessage = document.getElementById('error-message');
    const loading = document.getElementById('loading');

    if (!localStorage.getItem('token')) {
        window.location.href = `${BASE_URL}/login.html`;
        return;
    }

    if (!familyId || !/^\d+$/.test(familyId)) {
        errorMessage.textContent = 'Invalid or missing family ID';
        errorMessage.classList.remove('hidden');
        return;
    }

    const handleError = (error, redirectOn401 = false) => {
        if (redirectOn401 && error.message.includes('401')) {
            window.location.href = `${BASE_URL}/login.html`;
        }
        errorMessage.textContent = error.message || 'An error occurred';
        errorMessage.classList.remove('hidden');
        loading.classList.add('hidden');
    };

    try {
        loading.classList.remove('hidden');

        const response = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) {
            const status = response.status;
            throw new Error(status === 401 ? 'Unauthorized: Please log in again' : 'Failed to fetch family details');
        }

        const family = await response.json();
        if (!family.family_name) {
            throw new Error('Family name missing');
        }

        familyNameElement.textContent = `${family.family_name} – Categories`;
        loading.classList.add('hidden');
    } catch (error) {
        handleError(error, true);
    }
});