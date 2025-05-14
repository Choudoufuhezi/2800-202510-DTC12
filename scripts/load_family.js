import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Fetch and display family groups
    await fetchFamilyGroups();

    // Handle create family button
    const createBtn = document.getElementById('create-family-button');
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            if (!token) {
                alert("You're not logged in.");
                return;
            }

            // Prompt for a custom family name
            let familyName = prompt("Enter your family group name:");
            if (!familyName || familyName.trim() === "") {
                familyName = "My Family"; // Fallback default
            }

            try {
                const response = await fetch(`${API_URL}/family/create`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ family_name: familyName }),
                });

                if (response.ok) {
                    alert('Family group created!');
                    await fetchFamilyGroups(); // Refresh list
                } else {
                    const data = await response.json();
                    alert(data.detail || 'Failed to create family group.');
                }
            } catch (error) {
                console.error('Error creating family:', error);
                alert('Something went wrong.');
            }
        });
    }
});

async function fetchFamilyGroups() {
    const token = localStorage.getItem('token');
    const familiesContainer = document.getElementById('families-container');
    familiesContainer.innerHTML = ''; // Clear existing content

    try {
        const response = await fetch(`${API_URL}/family/my-families`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            window.location.href = '/login.html';
            throw new Error('Failed to fetch families');
        }

        const familyIds = await response.json();

        // Fetch details for each family
        for (const familyId of familyIds) {
            const response = await fetch(`${API_URL}/family/${familyId}/members`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
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
                        <h2 class="text-lg font-semibold text-gray-800">${family.family_name || `Family ${familyId}`}</h2>
                        <p class="text-sm text-gray-500 mt-1">${family.members.length} members</p>
                    </div>
                    <i class="fas fa-chevron-right text-indigo-600"></i>
                </div>
            `;

            familiesContainer.appendChild(familyCard);
        }
    } catch (error) {
        console.error('Error loading families:', error);
    }
}