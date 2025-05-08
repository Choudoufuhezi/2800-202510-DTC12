import {API_URL} from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {

        const familiesContainer = document.getElementById('families-container');

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
            
            const familyCard = document.createElement('a');
                familyCard.href = `family-members.html?familyId=${familyId}`;
                familyCard.className = 'block bg-white rounded-xl p-6 shadow hover:shadow-md transition hover:bg-indigo-50';
                
                familyCard.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-lg font-semibold text-gray-800">${`Family ${familyId}`}</h2>
                            <p class="text-sm text-gray-500 mt-1">${family.length} members</p>
                        </div>
                        <i class="fas fa-chevron-right text-indigo-600"></i>
                    </div>
                `;
                
                familiesContainer.appendChild(familyCard);
        });
    } catch (error) {
        console.error('Error loading families:', error);
    }
});

// Create new family

const createFamilyButton = document.getElementById('create-family-button');
createFamilyButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/family/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to create family');
        }

        const family = await response.json();
        console.log(family);
    } catch (error) {
        console.error('Error creating family:', error);
    }
});