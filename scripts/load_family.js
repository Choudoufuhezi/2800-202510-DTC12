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
        // Fetch details for each family

        familyIds.forEach(async (familyId) => {
            const response = await fetch(`${API_URL}/family/${familyId}/members`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch family');
            }

            const family = await response.json();
            console.log(family);
        });
    } catch (error) {
        console.error('Error loading families:', error);
    }
});