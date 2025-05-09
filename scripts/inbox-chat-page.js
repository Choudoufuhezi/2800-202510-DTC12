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
            window.location.href = "GroupChatPage.html";
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

    const updates = [
        { title: "✨ New Feature!", details: "Dark mode is now available." },
        { title: "📅 Upcoming Event", details: "Family meeting scheduled for this Sunday at 6 PM." },
        { title: "🔒 Security Update", details: "Please review the latest privacy settings." },
        { title: "⚠️ System Maintenance", details: "Chat servers will be down tonight from 2 AM - 3 AM." },
        { title: "👥 Group Announcement", details: "New members have joined the chat!" }
    ];

    // Open announcement modal with updates
    announcementBtn.addEventListener("click", () => {
        console.log("Opening updates modal...");

        // Populate structured updates inside light blue tabs
        announcementContent.innerHTML = updates.map(update => `
            <div class="bg-blue-100 p-3 rounded-lg shadow">
                <h4 class="font-semibold text-blue-900">${update.title}</h4>
                <p class="text-gray-700 text-sm">${update.details}</p>
            </div>
        `).join("");

        announcementModal.classList.remove("hidden");
    });

    // Close the modal when clicking the button
    closeAnnouncement.addEventListener("click", () => {
        console.log("Closing updates modal...");
        announcementModal.classList.add("hidden");
    });
});