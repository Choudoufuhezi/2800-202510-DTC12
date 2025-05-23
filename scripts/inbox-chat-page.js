document.addEventListener("DOMContentLoaded", () => {
    console.log("Script loaded!");

    // Chat List Data
    const chats = [
        {
            id: "bcit",
            name: "Robinson Family",
            avatar: "https://i.pravatar.cc/40?img=12",
            messages: [
                { from: "Alice", text: "Meeting at 5?" },
                { from: "You", text: "Yes, see you there!" }
            ]
        },
        {
            id: "Rose",
            name: "Cousin Rose",
            avatar: "https://i.pravatar.cc/40?img=20",
            messages: [
                { from: "Rose", text: "Thanks for the help!" },
                { from: "You", text: "You're welcome!" }
            ]
        }
    ];

    const list = document.getElementById("chat-list");

    // Render Chat List
    chats.forEach(chat => {
        const row = document.createElement("div");
        row.className = "flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer";
        row.addEventListener("click", () => {
            localStorage.setItem("activeChat", JSON.stringify(chat));
            window.location.href = "group_chat_page.html";
        });

        row.innerHTML = `
            <img src="${chat.avatar}" alt="Avatar" class="w-10 h-10 rounded-full mr-3">
            <div class="flex-1">
                <div class="flex justify-between">
                    <span class="font-medium">${chat.name}</span>
                    <span class="text-sm text-gray-400">${chat.time || ""}</span>
                </div>
            </div>
        `;

        list.appendChild(row);
    });

    // ANNOUNCEMENT FEATURE - Pulse-style Modal
    const announcementBtn = document.getElementById("announcement-btn");
    const announcementModal = document.getElementById("announcement-modal");
    const closeAnnouncement = document.getElementById("close-announcement");
    const announcementContent = document.getElementById("announcement-content");

    // New Announcement Form Elements
    const toggleFormBtn = document.getElementById("toggle-announcement-form");
    const announcementForm = document.getElementById("announcement-form");
    const announcementTitle = document.getElementById("announcement-title");
    const announcementBody = document.getElementById("announcement-body");

    const updates = [
        { title: "✨ New Feature!", details: "Dark mode is now available." },
        { title: "📅 Upcoming Event", details: "Family meeting scheduled for this Sunday at 6 PM." },
        { title: "🔒 Security Update", details: "Please review the latest privacy settings." },
        { title: "⚠️ System Maintenance", details: "Chat servers will be down tonight from 2 AM - 3 AM." },
        { title: "👥 Group Announcement", details: "New members have joined the chat!" }
    ];

    // Populate structured updates inside modal
    function renderAnnouncements() {
        announcementContent.innerHTML = updates.map((update, index) => {
            const isMine = update.from === "me"; // Only show more if from me

            return `
                <div class="relative bg-blue-100 p-3 rounded-lg shadow group">
                    <h4 class="font-semibold text-blue-900">${update.title}</h4>
                    <p class="text-gray-700 text-sm">${update.details}</p>
    
                    ${isMine ? `
                        <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" data-index="${index}" title="More Options">
                            ⋮
                        </button>
                    ` : ""}
                </div>
            `;
        }).join("");

        // Add event listeners to "More" buttons
        document.querySelectorAll('[data-index]').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                const confirmDelete = confirm("Delete this announcement?");
                if (confirmDelete) {
                    updates.splice(index, 1);
                    renderAnnouncements(); // Refresh the list
                }
            });
        });
    }
    

    // Open the modal
    announcementBtn.addEventListener("click", () => {
        console.log("Opening updates modal...");
        renderAnnouncements();
        announcementModal.classList.remove("hidden");
    });

    // Close the modal
    closeAnnouncement.addEventListener("click", () => {
        console.log("Closing updates modal...");
        announcementModal.classList.add("hidden");
    });

    // Toggle announcement form
    toggleFormBtn.addEventListener("click", () => {
        announcementForm.classList.toggle("hidden");
    });

    // Handle form submission
    announcementForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = announcementTitle.value.trim();
        const body = announcementBody.value.trim();

        if (title && body) {
            // Add to the top of the updates array
            updates.unshift({ title, details: body, from: "me" });

            // Re-render announcements and reset form
            renderAnnouncements();
            announcementForm.reset();
            announcementForm.classList.add("hidden");
        }
    });
});
