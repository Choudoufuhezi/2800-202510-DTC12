document.addEventListener("DOMContentLoaded", () => {
    // WebSocket setup
    const ws = new WebSocket(`ws://localhost:8000/ws/1`); // placeholder user ID 
    const chatroomId = 1; //  placeholder chatroom ID

    ws.onopen = () => {
        console.log("Connected to WebSocket");
        // Join the chatroom
        ws.send(JSON.stringify({
            type: "join_chatroom",
            chatroom_id: chatroomId
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "chat_message") {
            const bubble = createMessageBubble(
                data.sender_id === "1" ? "You" : `User ${data.sender_id}`,
                data.content,
                data.message_id
            );
            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    };

    ws.onclose = () => {
        console.log("Disconnected from WebSocket");
    };

    // Initialize chat UI elements
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

    let selectedMember = null;
    let replyTo = null;

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
                bubbleWrapper.remove();
            });
        }

        return bubbleWrapper;
    }

    document.getElementById("info-btn").addEventListener("click", () => {
        groupNameSpan.textContent = "Chatroom " + chatroomId;
        inviteLink.href = `https://example.com/invite/${chatroomId}`;
        inviteLink.textContent = inviteLink.href;

        memberList.innerHTML = "";
        // For now, just show placeholder members
        ["User 1", "User 2"].forEach(name => {
            const li = document.createElement("li");
            li.textContent = name;
            li.className = "cursor-pointer text-blue-600 hover:underline";
            li.addEventListener("click", () => {
                selectedMember = name;
                memberNameSpan.textContent = name;
                memberDetailModal.classList.remove("hidden");
            });
            memberList.appendChild(li);
        });

        groupInfoModal.classList.remove("hidden");
    });

    closeGroupInfo.addEventListener("click", () => {
        groupInfoModal.classList.add("hidden");
    });

    closeMemberDetail.addEventListener("click", () => {
        memberDetailModal.classList.add("hidden");
    });

    dmButton.addEventListener("click", () => {
        if (selectedMember) {
            window.location.href = `chat.html?user=${encodeURIComponent(selectedMember)}`;
        }
    });

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        if (replyTo?.editMode) {
            const oldBubble = document.querySelector(`[data-id="${replyTo.messageId}"] div`);
            if (oldBubble) oldBubble.textContent = text;
        } else {
            // Send message through WebSocket
            ws.send(JSON.stringify({
                type: "chat_message",
                chatroom_id: chatroomId,
                content: text
            }));

            // Create local message bubble
            const replyText = replyTo?.originalText || null;
            const bubble = createMessageBubble("You", text, Date.now(), replyText);
            chatBox.appendChild(bubble);
        }

        input.value = "";
        replyTo = null;
        document.getElementById("reply-preview").classList.add("hidden");
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });

    document.getElementById("cancel-reply").addEventListener("click", () => {
        replyTo = null;
        document.getElementById("reply-preview").classList.add("hidden");
    });
});
