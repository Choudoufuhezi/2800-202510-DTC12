async function fetchGroupChats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/users/chatrooms', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch group chats');
        }

        const groups = await response.json();
        return groups;
    } catch (error) {
        console.error('Error fetching group chats:', error);
        return [];
    }
}

async function fetchGroupChatInfo(groupID) {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8000/chatrooms/${groupID}/info`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch group chat info');
    }

    const groupInfo = await response.json();
    return groupInfo;
}

async function renderGroupChatItem(group) {
    const groupID = group.chatroom_id;
    const groupInfo = await fetchGroupChatInfo(groupID);
    const lastMessage = groupInfo.last_message || 'No messages yet';
    const memberCount = groupInfo.member_count || 0;

    console.log(groupInfo);
    
    return `
        <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
             onclick="window.location.href='GroupChatPage.html?chatroomId=${groupID}'">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">${group.name}</h3>
                    <p class="text-sm text-gray-600 mt-1">${group.description || ''}</p>
                </div>
                <div class="text-sm text-gray-500">
                    <span class="flex items-center">
                        ${memberCount} members
                    </span>
                </div>
            </div>
            <div class="mt-2">
                <p class="text-sm text-gray-600 truncate">Last message: ${lastMessage}</p>
            </div>
        </div>
    `;
}

async function renderGroupChats() {
    const groupChatsList = document.getElementById('group-chats-list');
    const groups = await fetchGroupChats();
    
    if (groups.length === 0) {
        groupChatsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-comments text-4xl mb-3"></i>
                <p>You haven't joined any group chats yet.</p>
                <p class="mt-2">Click "New Group" to create one!</p>
            </div>
        `;
        return;
    }

    const groupChatItems = await Promise.all(groups.map(group => renderGroupChatItem(group)));
    groupChatsList.innerHTML = groupChatItems.join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderGroupChats();
}); 