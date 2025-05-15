document.addEventListener("DOMContentLoaded", () => {
    let chat = null;
    let chats = {};
    let activeChatId = null;
    let replyTo = null;
    let selectedMember = null;

    // Try loading chats from localStorage
    try {
        const savedChats = localStorage.getItem("chats");
        const savedActiveChatId = localStorage.getItem("activeChatId");
        if (savedChats) chats = JSON.parse(savedChats);
        if (savedActiveChatId) activeChatId = savedActiveChatId;
    } catch (err) {
        console.error("Invalid chats data in localStorage:", err);
    }

    // If no saved chats, initialize with group chat
    if (!chats || Object.keys(chats).length === 0) {
        const groupChat = {
            name: "Robinson Family",
            id: "family123",
            avatar: "https://via.placeholder.com/40",
            members: ["You", "Alice Johnson", "Bob Smith", "Charlie Wang", "Diana Patel"],
            messages: [
                { from: "Alice Johnson", text: "Hi everyone!" },
                { from: "You", text: "Hey Alice!" },
                { from: "Charlie Wang", text: "Are we meeting tonight?" },
                { from: "You", text: "Yes, 7 PM works." }
            ]
        };
        chats[groupChat.id] = groupChat;
        activeChatId = groupChat.id;
        localStorage.setItem("chats", JSON.stringify(chats));
        localStorage.setItem("activeChatId", activeChatId);
    }

    // DOM Elements
    const groupInfoModal = document.getElementById("group-info");
    const closeGroupInfo = document.getElementById("close-group-info");
    const groupNameSpan = document.getElementById("info-group-name");
    const inviteLink = document.getElementById("invite-link");
    const memberList = document.getElementById("member-list");

    const memberDetailModal = document.getElementById("member-detail-modal");
    const closeMemberDetail = document.getElementById("close-member-detail");
    const memberNameSpan = document.getElementById("member-name");
    const dmButton = document.getElementById("dm-button");

    const input = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");
    const chatBox = document.getElementById("chat-box");

    // New: Back button to switch from DM to group chat
    const backBtn = document.getElementById("back-btn");
    const chatHeader = document.getElementById("chat-user-name");

    // Helper: Save chats and active chat to localStorage
    function saveChats() {
        localStorage.setItem("chats", JSON.stringify(chats));
        localStorage.setItem("activeChatId", activeChatId);
    }

    // Render chat header (group or DM)
    function renderHeader() {
        const currentChat = chats[activeChatId];
        if (!currentChat) return;

        if (currentChat.members.length > 2) {
            chatHeader.textContent = currentChat.name;
            backBtn.classList.add("hidden");
            document.getElementById("info-btn").classList.remove("hidden");
        } else {
            // DM chat
            const other = currentChat.members.find(m => m !== "You") || "Chat";
            chatHeader.textContent = other;
            backBtn.classList.remove("hidden");
            document.getElementById("info-btn").classList.add("hidden");
        }
    }

    // Clear chat messages and render current chat messages
    function renderMessages() {
        chatBox.innerHTML = "";
        const currentChat = chats[activeChatId];
        if (!currentChat) return;

        currentChat.messages.forEach(msg => {
            const bubble = createMessageBubble(msg.from, msg.text);
            chatBox.appendChild(bubble);
        });

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Create message bubble (keep your styles unchanged)
    function createMessageBubble(from, text, messageId = Date.now(), replyText = null) {
        const bubbleWrapper = document.createElement("div");
        bubbleWrapper.className = `flex ${from === "You" ? "justify-end" : "justify-start"} relative`;
        bubbleWrapper.dataset.id = messageId;

        const bubble = document.createElement("div");
        bubble.className = `${from === "You" ? "bg-blue-100" : "bg-gray-200"} text-gray-800 px-4 py-2 rounded-lg max-w-xs shadow`;

        if (replyText) {
            const replyPreview = document.createElement("div");
            replyPreview.className = "text-xs text-gray-600 italic border-l-2 border-blue-400 pl-2 mb-1";
            replyPreview.textContent = replyText;
            bubble.appendChild(replyPreview);
        }

        const messageText = document.createElement("div");
        messageText.textContent = text;
        bubble.appendChild(messageText);
        bubbleWrapper.appendChild(bubble);

        if (from === "You") {
            const menuBtn = document.createElement("button");
            menuBtn.innerHTML = "⋮";
            menuBtn.className = "ml-2 text-gray-500 hover:text-gray-800 focus:outline-none";

            const menuBox = document.createElement("div");
            menuBox.className = "absolute right-0 top-full mt-2 w-32 bg-white border rounded shadow hidden z-10 menu-box";
            menuBox.innerHTML = `
                <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer reply-btn">Reply</div>
                <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer edit-btn">Edit</div>
                <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer delete-btn">Delete</div>
            `;

            menuBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                document.querySelectorAll(".menu-box").forEach(box => box.classList.add("hidden"));
                menuBox.classList.toggle("hidden");
            });

            document.addEventListener("click", () => {
                menuBox.classList.add("hidden");
            });

            const rightSide = document.createElement("div");
            rightSide.className = "flex flex-col items-end";
            rightSide.appendChild(menuBtn);
            rightSide.appendChild(menuBox);
            bubbleWrapper.appendChild(rightSide);

            menuBox.querySelector(".reply-btn").addEventListener("click", () => {
                replyTo = { messageId, originalText: text };
                document.getElementById("reply-text").textContent = text;
                document.getElementById("reply-preview").classList.remove("hidden");
                input.focus();
            });

            menuBox.querySelector(".edit-btn").addEventListener("click", () => {
                input.value = text;
                input.focus();
                replyTo = { messageId, editMode: true };
            });

            menuBox.querySelector(".delete-btn").addEventListener("click", () => {
                // Remove from messages array as well
                const currentChat = chats[activeChatId];
                if (!currentChat) return;
                currentChat.messages = currentChat.messages.filter(m => m.text !== text || m.from !== from);
                saveChats();
                bubbleWrapper.remove();
            });
        }

        return bubbleWrapper;
    }

    // Send message handler
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        const currentChat = chats[activeChatId];
        if (!currentChat) return;

        if (replyTo?.editMode) {
            // Edit existing message
            const msg = currentChat.messages.find(m => m.id === replyTo.messageId);
            if (msg) msg.text = text;
            replyTo = null;
            saveChats();
            renderMessages();
        } else {
            // Add new message, with optional reply preview
            const newMsg = { from: "You", text, id: Date.now() };
            currentChat.messages.push(newMsg);
            saveChats();
            const bubble = createMessageBubble("You", text, newMsg.id, replyTo?.originalText || null);
            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
            replyTo = null;
        }

        input.value = "";
        document.getElementById("reply-preview").classList.add("hidden");
    }

    // Open group info modal and populate members list
    document.getElementById("info-btn").addEventListener("click", () => {
        const currentChat = chats[activeChatId];
        if (!currentChat || currentChat.members.length <= 2) return;

        groupNameSpan.textContent = currentChat.name;
        inviteLink.href = `https://example.com/invite/${currentChat.id}`;
        inviteLink.textContent = inviteLink.href;

        memberList.innerHTML = "";
        currentChat.members.forEach(name => {
            if (name === "You") return; // Skip yourself

            const li = document.createElement("li");
            li.textContent = name;
            li.className = "cursor-pointer text-blue-600 hover:underline";
            li.addEventListener("click", () => {
                selectedMember = name;
                memberNameSpan.textContent = name;
                memberDetailModal.classList.remove("hidden");
                groupInfoModal.classList.add("hidden");
            });
            memberList.appendChild(li);
        });

        groupInfoModal.classList.remove("hidden");
    });

    // Member detail modal close
    closeMemberDetail.addEventListener("click", () => {
        memberDetailModal.classList.add("hidden");
    });

    // Group info modal close
    closeGroupInfo.addEventListener("click", () => {
        groupInfoModal.classList.add("hidden");
    });

    // DM button: open or create DM chat in same UI
    dmButton.addEventListener("click", () => {
        if (!selectedMember) return;

        // Generate chat id for DM
        const dmId = `dm_${selectedMember.replace(/\s+/g, "_").toLowerCase()}`;

        if (!chats[dmId]) {
            chats[dmId] = {
                id: dmId,
                name: null,
                members: ["You", selectedMember],
                messages: []
            };
        }

        activeChatId = dmId;
        saveChats();
        renderHeader();
        renderMessages();
        memberDetailModal.classList.add("hidden");
        groupInfoModal.classList.add("hidden");
        input.value = "";
        replyTo = null;
    });

    // Back button to return to group chat
    backBtn.addEventListener("click", () => {
        const groupChatId = Object.values(chats).find(c => c.members.length > 2)?.id;
        if (groupChatId) {
            activeChatId = groupChatId;
            saveChats();
            renderHeader();
            renderMessages();
        }
    });

    // Send message events
    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });

    document.getElementById("cancel-reply").addEventListener("click", () => {
        replyTo = null;
        document.getElementById("reply-preview").classList.add("hidden");
    });

    // Initial render
    renderHeader();
    renderMessages();
});