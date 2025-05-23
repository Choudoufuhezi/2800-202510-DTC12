import {API_URL} from './config.js';

// Get family ID from URL
const urlParams = new URLSearchParams(window.location.search);
const familyId = urlParams.get('familyId');

// DOM Elements
const membersContainer = document.getElementById('members-container');

// Fetch and display family members
async function loadFamilyMembers() {
    let timeoutId;
    try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 15000);
        controller.signal.onabort = () => {
            console.log("Fetch aborted due to timeout");
        };

        const response = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Failed to fetch family members');
        }

        const members = await response.json();
        
        // Clear existing members
        membersContainer.innerHTML = '';
        
        // Display each member
        members.forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'bg-white p-4 rounded-xl shadow hover:shadow-md transition cursor-pointer';
            memberElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <i class="fas fa-user text-indigo-600"></i>
                        </div>
                        <div class="ml-3">
                            <h3 class="font-medium">${member.email}</h3>
                            ${member.is_admin ? '<span class="text-xs text-indigo-600">Admin</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
            membersContainer.appendChild(memberElement);
        });
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            membersContainer.innerHTML = '<p class="text-red-500">Server timed out, please try again later.</p>';
        } else {
            console.error('Error loading family members:', error);
            membersContainer.innerHTML = '<p class="text-red-500">Failed to load family members</p>';
        }
    }
}

async function createInvite() {
    try {
        const response = await fetch(`${API_URL}/family/create-invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                family_id: parseInt(familyId),
                expires_in_hours: 24,
                max_uses: 1
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create invite');
        }

        const inviteData = await response.json();
        // redirect to manage-members.html with the invite code
        window.location.href = `manage-members.html?inviteCode=${inviteData.code}`;
    } catch (error) {
        console.error('Error creating invite:', error);
    }
}

// Add click handler to invite button
document.querySelector('a[href="manage-members.html"]').addEventListener('click', (e) => {
    e.preventDefault();
    createInvite();
});

// Load family members when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!familyId) {
        membersContainer.innerHTML = '<p class="text-red-500">No family ID provided</p>';
        return;
    }
    loadFamilyMembers();

    // Add click handler for group chat button
    const createGroupChatBtn = document.getElementById('create-group-chat');
    if (createGroupChatBtn) {
        // Check if family chat exists
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
                    window.location.href = `group_chat_page.html?chatroomId=${chatData.chatroom_id}`;
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
                        window.location.href = `group_chat_page.html?chatroomId=${chatData.chatroom_id}`;
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
