import { API_URL, BASE_URL } from './config.js';

const urlParams = new URLSearchParams(window.location.search);
const rawFamilyId = urlParams.get('familyId');
const familyId = parseInt(rawFamilyId, 10);

const familyNameElement = document.getElementById('family-name');
const membersContainer = document.getElementById('members-container');
const inviteButton = document.getElementById('invite-button');
const errorMessage = document.getElementById('error-message');

console.log('Family ID from URL:', familyId);

if (!localStorage.getItem('token')) {
    console.log('No token found, redirecting to login');
    window.location.href = `${BASE_URL}/login.html`;
}

async function loadFamilyDetails() {
    console.log('Loading family details...');
    membersContainer.innerHTML = `
        <div class="flex justify-center">
            <svg class="animate-spin h-5 w-5 text-sky-600" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8z"></path>
            </svg>
        </div>`;
    errorMessage.classList.add('hidden');

    try {
        if (isNaN(familyId)) throw new Error('Invalid family ID');

        const response = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                window.location.href = `${BASE_URL}/login.html`;
                throw new Error('Unauthorized: Please log in again');
            }
            if (response.status === 403) {
                throw new Error('You are not a member of this family');
            }
            throw new Error(errorData.detail || 'Failed to fetch family members');
        }

        const family = await response.json();
        familyNameElement.textContent = `${family.family_name} – Members`;

        const memoriesResponse = await fetch(`${API_URL}/memories/${familyId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        const memories = await memoriesResponse.json();

        if (!Array.isArray(memories)) {
            console.error('Memories response is not an array:', memories);
            throw new Error('Failed to fetch valid memory list');
        }

        const memoriesByUser = {};

        memories.forEach(memory => {
            if (memory.tags !== 'Photos') return;
            if (!memoriesByUser[memory.user_id]) memoriesByUser[memory.user_id] = [];
            if (memoriesByUser[memory.user_id].length < 3) {
                memoriesByUser[memory.user_id].push(memory);
            }
        });

        membersContainer.innerHTML = '';

        if (!family.members || family.members.length === 0) {
            membersContainer.innerHTML = '<p class="text-gray-600">No members found. Invite someone!</p>';
            return;
        }

        for (const member of family.members) {
            const memberMemories = memoriesByUser[member.user_id] || [];

            const memberContainer = document.createElement("div")
            memberContainer.className = 'flex flex-row bg-white p-4 rounded-xl shadow hover:shadow-md transition';

            const memberCard = document.createElement('div');
            memberCard.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <a 
                            href="member-categories.html?userId=${member.user_id}&familyId=${familyId}" 
                            class="text-lg font-semibold text-sky-700 hover:underline">
                            ${member.custom_name || member.email}
                        </a>
                        <p class="text-sm text-gray-500">
                            ${member.relationship || (member.is_admin ? 'Admin' : 'Member')}
                        </p>
                    </div>
                </div>
                <div class="mt-2">
                    <h4 class="text-sm font-medium text-gray-700">Recent Photos:</h4>
                    ${memberMemories.length > 0 ? `
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            ${memberMemories.map(memory => `
                                <img src="${memory.file_url}" alt="Photo memory" class="w-full h-24 object-cover rounded-lg" />
                            `).join('')}
                        </div>
                    ` : '<p class="text-sm text-gray-600">No recent photos</p>'}
                </div>
            `;

            const adminButtonModal = document.createElement('button');
            adminButtonModal.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
            adminButtonModal.className = "text-red-500 hover:text-red-700 p-4 text-xl";

            const dropdownMenu = document.createElement('div');
            dropdownMenu.className = "hidden absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50";

            const options = document.createElement('ul')
            options.className = "text-gray-700";

            const option_delete = document.createElement("li")
            option_delete.className = "px-4 py-2 hover:bg-gray-100 cursor-pointer"
            option_delete.innerHTML = "Delete User From Family"
            option_delete.addEventListener("click", async () => {
                if (confirm("Are you sure you want to delete this user?")) {
                    delete_user(member.user_id, familyId)
                }
            })

            const option_update_admin = document.createElement("li")
            option_update_admin.className = "px-4 py-2 hover:bg-gray-100 cursor-pointer"
            option_update_admin.innerHTML = "Make User Admin"
            option_update_admin.addEventListener("click", async () => {
                if (confirm("Are you sure you want to make the user as admin?")) {
                    update_admin(member.user_id, familyId)
                }
            })

            options.appendChild(option_delete)
            options.appendChild(option_update_admin)
            dropdownMenu.appendChild(options)

            adminButtonModal.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('hidden');
            });

            document.addEventListener('click', () => {
                dropdownMenu.classList.add('hidden');
            });

            const container = document.createElement('div');
            container.className = "relative inline-block ml-auto";
            container.appendChild(adminButtonModal);
            container.appendChild(dropdownMenu);

            memberContainer.appendChild(memberCard);
            memberContainer.appendChild(container);
            membersContainer.appendChild(memberContainer);
        }

    } catch (error) {
        console.error('Error in family-members.js:', error);
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
        membersContainer.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFamilyDetails();

    inviteButton.addEventListener('click', () => {
        window.location.href = `${BASE_URL}/manage-members.html?familyId=${familyId}`;
    });

    const createGroupChatBtn = document.getElementById('create-group-chat');
    if (createGroupChatBtn) {
        // Check if family chat existsgit a
        fetch(`${API_URL}/chatrooms/family/${familyId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                return null;
            })
            .then(chatData => {
                if (chatData) {
                    // Family chat exists, update button
                    createGroupChatBtn.innerHTML = '<i class="fas fa-comments"></i> Go to Family Group Chat';
                    createGroupChatBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    createGroupChatBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');

                    // Update click handler to navigate to existing chat
                    createGroupChatBtn.onclick = () => {
                        window.location.href = `GroupChatPage.html?chatroomId=${chatData.chatroom_id}`;
                    };
                } else {
                    // No family chat exists, keep original create behavior
                    createGroupChatBtn.onclick = async () => {
                        try {
                            const response = await fetch(`${API_URL}/chatrooms/create-family-chat`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({
                                    family_id: parseInt(familyId)
                                })
                            });

                            if (!response.ok) {
                                throw new Error('Failed to create group chat');
                            }

                            const chatData = await response.json();
                            // Redirect to the group chat page
                            window.location.href = `GroupChatPage.html?chatroomId=${chatData.chatroom_id}`;
                        } catch (error) {
                            console.error('Error creating group chat:', error);
                            alert('Failed to create group chat. Please try again.');
                        }
                    };
                }
            })
            .catch(error => {
                console.error('Error checking family chat:', error);
            });
    }
});


async function delete_user(target_user_id, family_id) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/family/${family_id}/${target_user_id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to delete user:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error deleting user:", error);
        return false;
    }
}

async function update_admin(target_user_id, family_id) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/family/${family_id}/${target_user_id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to delete user:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error giving user admin status:", error);
        return false;
    }
}

