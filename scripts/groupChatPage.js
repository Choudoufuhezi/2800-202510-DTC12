document.addEventListener("DOMContentLoaded", () => {
    const chat = JSON.parse(localStorage.getItem("activeChat"));

    if (!chat) {
        window.location.href = "inbox_page.html";
        return;
    }

    let replyTo = null;

    const input = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");
    const chatBox = document.getElementById("chat-box");

    function createMessageBubble(from, text, messageId = Date.now(), replyText = null) {
        const bubbleWrapper = document.createElement("div");
        bubbleWrapper.className = `flex ${from === "You" ? "justify-end" : "justify-start"} relative`;
        bubbleWrapper.dataset.id = messageId;

        const bubble = document.createElement("div");
        bubble.className = `${from === "You" ? "bg-blue-100" : "bg-gray-200"} text-gray-800 px-4 py-2 rounded-lg max-w-xs shadow`;

        // Top reply preview
        if (replyText) {
            const replyPreview = document.createElement("div");
            replyPreview.className = "text-xs text-gray-600 italic border-l-2 border-blue-400 pl-2 mb-1";
            replyPreview.textContent = replyText;
            bubble.appendChild(replyPreview);
        }

        // Message text
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

            // Menu actions
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

    // Set header
    document.querySelector("h2").textContent = chat.name;
    document.querySelector("img").src = chat.avatar;

    // Render existing messages
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

    document.addEventListener("DOMContentLoaded", () => {
        console.log("Script loaded!");

        const groupHeader = document.getElementById("group-header");
        const groupInfoModal = document.getElementById("group-info");
        const closeGroupInfo = document.getElementById("close-group-info");

        const memberDetailModal = document.getElementById("member-detail-modal");
        const closeMemberDetail = document.getElementById("close-member-detail");
        const memberNameSpan = document.getElementById("member-name");
        const dmButton = document.getElementById("dm-button");

        const memberListContainer = document.getElementById("member-list");

        // Check if activeChat exists in localStorage
        const chat = JSON.parse(localStorage.getItem("activeChat"));
        if (!chat) {
            window.location.href = "inbox_page.html";
            return;
        }

        console.log("Chat data:", chat);

        // Open Group Info Modal when clicking on group header
        groupHeader.addEventListener("click", () => {
            console.log("Group header clicked - opening modal");

            document.getElementById("info-group-name").textContent = chat.name;
            document.getElementById("invite-link").href = chat.inviteLink;
            document.getElementById("invite-link").textContent = chat.inviteLink;

            // Populate member list
            memberListContainer.innerHTML = "";
            chat.members.forEach(member => {
                const listItem = document.createElement("li");
                listItem.textContent = member.name;
                listItem.className = "cursor-pointer text-blue-600 hover:underline";
                listItem.dataset.id = member.id;

                listItem.addEventListener("click", () => {
                    console.log("Member selected:", member.name);
                    memberNameSpan.textContent = member.name;
                    memberDetailModal.classList.remove("hidden");

                    dmButton.onclick = () => {
                        console.log(`Redirecting to chat_page.html?user=${member.id}`);
                        window.location.href = `chat_page.html?user=${member.id}`;
                    };
                });

                memberListContainer.appendChild(listItem);
            });

            groupInfoModal.classList.remove("hidden");
        });

        // Close Modals
        closeGroupInfo.addEventListener("click", () => {
            console.log("Closing group info modal");
            groupInfoModal.classList.add("hidden");
        });

        closeMemberDetail.addEventListener("click", () => {
            console.log("Closing member detail modal");
            memberDetailModal.classList.add("hidden");
        });
    });

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });

    document.getElementById("cancel-reply").addEventListener("click", () => {
        replyTo = null;
        document.getElementById("reply-preview").classList.add("hidden");
    });
});
