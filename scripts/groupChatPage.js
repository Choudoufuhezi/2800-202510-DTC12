document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === "") return;

        const bubble = document.createElement("div");
        bubble.className = "flex justify-end";

        const content = document.createElement("div");
        content.className = "bg-blue-100 text-gray-800 px-4 py-2 rounded-lg max-w-xs shadow";
        content.textContent = message;

        bubble.appendChild(content);
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;

        messageInput.value = "";
    }

    sendBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // Group info modal logic
    const groupHeader = document.getElementById("group-header");
    const groupInfoModal = document.getElementById("group-info");
    const closeGroupInfo = document.getElementById("close-group-info");
    const groupNameSpan = document.getElementById("info-group-name");
    const memberList = document.getElementById("member-list");
    const inviteLink = document.getElementById("invite-link");

    // Dummy group data
    const chat = {
        name: "Robinson Family",
        id: "abc123",
        members: ["Alice", "Bob", "Charlie", "Diana"]
    };

    groupHeader.addEventListener("click", () => {
        groupNameSpan.textContent = chat.name;
        inviteLink.href = `https://yourapp.com/invite/${chat.id}`;
        inviteLink.textContent = inviteLink.href;

        memberList.innerHTML = "";
        chat.members.forEach(name => {
            const li = document.createElement("li");
            li.textContent = name;
            memberList.appendChild(li);
        });

        groupInfoModal.classList.remove("hidden");
    });

    closeGroupInfo.addEventListener("click", () => {
        groupInfoModal.classList.add("hidden");
    });
});
