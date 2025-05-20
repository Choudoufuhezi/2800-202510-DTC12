import { API_URL, BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) {
        window.location.href = `/login.html`;
        return;
    }

    const form = document.getElementById('create-family-form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const familyName = document.getElementById('family-name').value.trim();
        console.log("Creating family:", familyName);
        errorMessage.classList.add('hidden');

        if (!familyName) {
            errorMessage.textContent = 'Family name is required';
            errorMessage.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/family/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ family_name: familyName }),
            });

            console.log(" Server responded:", response);

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = `/login.html`;
                    throw new Error('Unauthorized');
                }
                if (response.status === 400) {
                    throw new Error('Family name is required');
                }
                throw new Error('Failed to create family');
            }

            const data = await response.json();
            console.log("✅ Created family data:", data);

            window.location.href = `/family-groups.html`;
        } catch (error) {
            console.error(' Error creating family:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
}); 