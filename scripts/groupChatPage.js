document.addEventListener("DOMContentLoaded", () => {
    const chat = JSON.parse(localStorage.getItem("activeChat"));

    let replyTo = null;

        // Create message bubble
        const bubble = document.createElement("div");
        bubble.className = `flex ${from === "You" ? "justify-end" : "justify-start"} relative`;
        bubble.dataset.id = messageId;

        const content = document.createElement("div");
        content.className = `${from === "You" ? "bg-blue-100" : "bg-gray-200"} text-gray-800 px-4 py-2 rounded-lg max-w-xs shadow`;
        content.textContent = text;

        bubble.appendChild(content);

        if (from === "You") {
            // Menu button
            const menuBtn = document.createElement("button");
            menuBtn.innerHTML = "⋮";
            menuBtn.className = "ml-2 text-gray-500 hover:text-gray-800 focus:outline-none";

            // Menu box
            const menuBox = document.createElement("div");
            menuBox.className = "absolute right-0 top-full mt-2 w-32 bg-white border rounded shadow hidden z-10";
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
            bubble.appendChild(rightSide);

            // Add logic for reply/edit/delete
            menuBox.querySelector(".reply-btn").addEventListener("click", () => {
                replyTo = { messageId, originalText: text };
                document.getElementById("reply-text").textContent = text;
                document.getElementById("reply-preview").classList.remove("hidden");
                input.focus();
            });

            // Cancel reply
            document.getElementById("cancel-reply").addEventListener("click", () => {
                replyTo = null;
                document.getElementById("reply-preview").classList.add("hidden");
            });



            if (replyText) {
                const replyBox = document.createElement("div");
                replyBox.className = "text-xs text-gray-500 italic mb-1 border-l-2 border-blue-300 pl-2";
                replyBox.textContent = replyText;
                content.prepend(replyBox);
            }


            menuBox.querySelector(".edit-btn").addEventListener("click", () => {
                input.value = text;
                input.focus();
                replyTo = { messageId, editMode: true };
            });

            menuBox.querySelector(".delete-btn").addEventListener("click", () => {
                bubble.remove();
            });

            menuBox.classList.add("menu-box");
        }

        return bubble;
    }


    if (!chat) {
        window.location.href = "inbox_page.html"; // fallback if accessed directly
        return;
    }

    // Set header
    document.querySelector("h2").textContent = chat.name;
    document.querySelector("img").src = chat.avatar;

    // Render messages
    const chatBox = document.getElementById("chat-box");
    chat.messages.forEach(msg => {
        const bubble = createMessageBubble(msg.from, msg.text);
        chatBox.appendChild(bubble);
    });

    // Sending new messages
    const input = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        if (replyTo?.editMode) {
            // Edit existing message
            const oldBubble = document.querySelector(`[data-id="${replyTo.messageId}"] div`);
            if (oldBubble) oldBubble.textContent = text;
        } else {
            // Add new message with optional reply
            const replyText = replyTo?.originalText || null;
            const bubble = createMessageBubble("You", text, Date.now(), replyText);
            chatBox.appendChild(bubble);
        }

        input.value = "";
        input.placeholder = "Type a message";
        replyTo = null;
        document.getElementById("reply-preview").classList.add("hidden");
        chatBox.scrollTop = chatBox.scrollHeight;
    }


    sendBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });
});