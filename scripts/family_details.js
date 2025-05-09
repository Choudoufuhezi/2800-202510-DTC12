import {API_URL} from './config.js';

// Get family ID from URL
const urlParams = new URLSearchParams(window.location.search);
const familyId = urlParams.get('familyId');

// DOM Elements
const membersContainer = document.getElementById('members-container');
const familyNameElement = document.querySelector('h2');

// Fetch and display family members
async function loadFamilyMembers() {
    try {
        const response = await fetch(`${API_URL}/family/${familyId}/members`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

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
        console.error('Error loading family members:', error);
        membersContainer.innerHTML = '<p class="text-red-500">Failed to load family members</p>';
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
});
