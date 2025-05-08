document.addEventListener("DOMContentLoaded", () => {
    console.log("Script loaded!");

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

    // ANNOUNCEMENT FEATURE
    const announcementBtn = document.getElementById("announcement-btn");
    const announcementModal = document.getElementById("announcement-modal");
    const closeAnnouncement = document.getElementById("close-announcement");
    const announcementContent = document.getElementById("announcement-content");

    const announcements = [
        "Welcome to the group!",
        "Reminder: Family meeting at 6 PM tomorrow.",
        "Group chat rules updated—check pinned messages."
    ];

    announcementBtn.addEventListener("click", () => {
        console.log("Opening announcement modal...");
        announcementContent.innerHTML = announcements.map(a => `<p class="mb-2">${a}</p>`).join("");
        announcementModal.classList.remove("hidden");
    });

    closeAnnouncement.addEventListener("click", () => {
        console.log("Closing announcement modal...");
        announcementModal.classList.add("hidden");
    });

    // LEFT-TOP BUTTON FEATURE
    // const leftTopBtn = document.getElementById("left-top-btn");
    // const leftModal = document.getElementById("left-modal");
    // const closeLeftModal = document.getElementById("close-left-modal");

    // leftTopBtn.addEventListener("click", () => {
    //     console.log("Opening left top modal...");
    //     leftModal.classList.remove("hidden");
    // });

    // closeLeftModal.addEventListener("click", () => {
    //     console.log("Closing left top modal...");
    //     leftModal.classList.add("hidden");
    // });
});