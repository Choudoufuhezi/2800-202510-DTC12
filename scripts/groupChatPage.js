document.addEventListener("DOMContentLoaded", () => {
    let chat = JSON.parse(localStorage.getItem("activeChat"));

    if (!chat) {
        chat = {
            name: "Robinson Family",
            id: "family123",
            avatar: "https://via.placeholder.com/40",
            members: ["Alice Johnson", "Bob Smith", "Charlie Wang", "Diana Patel"],
            messages: [
                { from: "Alice Johnson", text: "Hi everyone!" },
                { from: "You", text: "Hey Alice!" },
                { from: "Charlie Wang", text: "Are we meeting tonight?" },
                { from: "You", text: "Yes, 7 PM works." }
            ]
        };
        localStorage.setItem("activeChat", JSON.stringify(chat));
    }

    let replyTo = null;

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

    // No longer setting group name or avatar since header is removed

    document.getElementById("info-btn").addEventListener("click", () => {
        groupNameSpan.textContent = chat.name;
        inviteLink.href = `https://example.com/invite/${chat.id}`;
        inviteLink.textContent = inviteLink.href;

        memberList.innerHTML = "";
        (chat.members || []).forEach(name => {
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

    chat.messages.forEach(msg => {
        const bubble = createMessageBubble(msg.from, msg.text);
        chatBox.appendChild(bubble);
    });

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        if (replyTo?.editMode) {
            const oldBubble = document.querySelector(`[data-id="${replyTo.messageId}"] div`);
            if (oldBubble) oldBubble.textContent = text;
        } else {
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
