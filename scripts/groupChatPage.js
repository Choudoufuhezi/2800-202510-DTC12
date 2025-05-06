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

    if (sendBtn && messageInput) {
        sendBtn.addEventListener("click", sendMessage);
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }

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

    // Member detail modal logic
    const memberDetailModal = document.getElementById("member-detail-modal");
    const closeMemberDetail = document.getElementById("close-member-detail");
    const memberNameSpan = document.getElementById("member-name");
    const dmButton = document.getElementById("dm-button");

    let selectedMember = null;

    function updateMemberList() {
        memberList.innerHTML = "";
        chat.members.forEach(name => {
            const li = document.createElement("li");
            li.textContent = name;
            li.classList.add("cursor-pointer", "hover:underline", "text-blue-600");
            li.addEventListener("click", () => {
                selectedMember = name;
                memberNameSpan.textContent = name;
                memberDetailModal.classList.remove("hidden");
            });
            memberList.appendChild(li);
        });
    }

    if (groupHeader) {
        groupHeader.addEventListener("click", () => {
            groupNameSpan.textContent = chat.name;
            inviteLink.href = `https://yourapp.com/invite/${chat.id}`;
            inviteLink.textContent = inviteLink.href;
            updateMemberList();
            groupInfoModal.classList.remove("hidden");
        });
    }

    if (closeGroupInfo) {
        closeGroupInfo.addEventListener("click", () => {
            groupInfoModal.classList.add("hidden");
        });
    }

    if (closeMemberDetail) {
        closeMemberDetail.addEventListener("click", () => {
            memberDetailModal.classList.add("hidden");
        });
    }

    if (dmButton) {
        dmButton.addEventListener("click", () => {
            if (selectedMember) {
                window.location.href = `/chat.html?user=${encodeURIComponent(selectedMember)}`;
            }
        });
    }

    // Chat page logic: load user from query param
    const chatHeader = document.getElementById("chat-header");
    const params = new URLSearchParams(window.location.search);
    const username = params.get("user");

    if (chatHeader && username) {
        chatHeader.textContent = `Chat with ${username}`;
    }
});
