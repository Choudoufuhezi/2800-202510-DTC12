import {API_URL} from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/family/my-families`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch families');
        }

        const familyIds = await response.json();

        console.log(familyIds)

        loadingMessage.remove();
        // Fetch details for each family
    } catch (error) {
        console.error('Error loading families:', error);
    }
});