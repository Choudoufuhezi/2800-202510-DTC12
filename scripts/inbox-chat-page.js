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
        <span class="text-sm text-gray-400">${chat.time}</span>
      </div>
    </div>
  `;

    list.appendChild(row);
});