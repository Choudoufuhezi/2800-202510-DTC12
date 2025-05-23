import { API_URL, BASE_URL } from './config.js';

const familiesContainer = document.getElementById('families-container');
const errorMessage = document.getElementById('error-message');

async function loadFamilies() {
    if (!localStorage.getItem('token')) {
        window.location.href = `${BASE_URL}/login.html`;
        return;
    }

    familiesContainer.innerHTML = '<div class="flex justify-center"><svg class="animate-spin h-5 w-5 text-sky-600" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8z"></path></svg></div>';
    errorMessage.classList.add('hidden');

    let timeoutId;
    try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 15000);
        controller.signal.onabort = () => {
            console.log("Fetch aborted due to timeout");
        };

        const response = await fetch(`${API_URL}/family/my-families`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = `${BASE_URL}/login.html`;
                throw new Error('Unauthorized');
            }
            throw new Error('Failed to fetch families');
        }

        const families = await response.json();
        familiesContainer.innerHTML = '';

        if (families.length === 0) {
            familiesContainer.innerHTML = '<p class="text-gray-600">No families found. Create a new one!</p>';
            return;
        }

        console.log("Fetched families:", families);
        for (const family of families) {
            if (!family.family_name) {
                console.warn(`Family ${family.id} has no name`);
                continue;
            }

            const familyCard = document.createElement('div');
            familyCard.className = 'block bg-white p-4 rounded-xl shadow hover:shadow-md transition';
            familyCard.innerHTML = `
        <div class="flex justify-between items-center">
            <a href="family-members.html?familyId=${family.id}" class="flex-1">
                <div>
                    <h2 class="text-lg font-semibold text-gray-800">${family.family_name}</h2>
                    <p class="text-sm text-gray-500 mt-1">${family.members.length} members</p>
                </div>
            </a>
            <button class="edit-name-button" data-family-id="${family.id}" data-current-name="${family.family_name}">
                <i class="fas fa-edit text-sky-600 hover:text-sky-700"></i>
            </button>
        </div>
    `;
            familiesContainer.appendChild(familyCard);
        }

        document.querySelectorAll('.edit-name-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const familyId = e.currentTarget.dataset.familyId;
                const currentName = e.currentTarget.dataset.currentName;
                const newName = prompt('Enter new family name:', currentName);
                if (newName && newName.trim() && newName !== currentName) {
                    try {
                        const response = await fetch(`${API_URL}/family/${familyId}/update`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            },
                            body: JSON.stringify({ family_name: newName.trim() }),
                        });
                        if (!response.ok) {
                            if (response.status === 401) window.location.href = `${BASE_URL}/login.html`;
                            if (response.status === 403) throw new Error('Only admins can update family name');
                            throw new Error('Failed to update family name');
                        }
                        await loadFamilies();
                    } catch (error) {
                        console.error('Error updating family name:', error);
                        errorMessage.textContent = error.message;
                        errorMessage.classList.remove('hidden');
                    }
                }
            });
        });
    } catch (error) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
            errorMessage.textContent = 'Server timed out, please try again later.';
            errorMessage.classList.remove('hidden');
            familiesContainer.innerHTML = '';
            return;
        }
        else {
        console.error('Error loading families:', error);
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', loadFamilies);