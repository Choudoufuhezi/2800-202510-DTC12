document.addEventListener("DOMContentLoaded", () => {
    const chats = [
        {
            id: 1,
            name: "petersons",
            avatar: "https://i.pravatar.cc/40?img=12",
            lastMessage: "Meeting is at 5pm!",
            time: "10:24 AM",
            isMessage: true
        },
        {
            id: 2,
            name: "Robinson family",
            avatar: "https://i.pravatar.cc/40?img=20",
            lastMessage: "Thanks for the help!",
            time: "9:15 AM",
            isMessage: false
        },
        {
            id: 3,
            name: "Rose",
            avatar: "https://i.pravatar.cc/40?img=18",
            lastMessage: "Code is now working",
            time: "Yesterday",
            isMessage: true
        }
    ];

    const list = document.getElementById("chat-list");

    chats.forEach(chat => {
        const row = document.createElement("div");
        row.className = "flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer";
        row.addEventListener("click", () => {
            localStorage.setItem("selectedGroup", JSON.stringify(chat));
            window.location.href = "chat.html";
        });

        row.innerHTML = `
      <img src="${chat.avatar}" alt="Avatar" class="w-10 h-10 rounded-full mr-3">
      <div class="flex-1">
        <div class="flex justify-between">
          <span class="font-medium">${chat.name}</span>
          <span class="text-sm text-gray-400">${chat.time}</span>
        </div>
        <p class="text-sm text-gray-600 truncate">${chat.lastMessage}</p>
      </div>
    `;

        list.appendChild(row);
    });
});
