document.addEventListener("DOMContentLoaded", async () => {
    // Get token
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("Not logged in");
        window.location.href = "/login.html";
        return;
    }

    // Get user ID
    let userId;
    try {
        const response = await fetch("http://localhost:8000/user/id", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error("Failed to get user ID");
        }
        const data = await response.json();
        userId = data.user_id.toString();
        console.log("Got user ID:", userId);
    } catch (error) {
        console.error("Error getting user ID:", error);
        return;
    }

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

    // TODO: Move this to another aspect, rn it could be confusing
    const translationSelect = document.createElement("select");
    translationSelect.className = "p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-300";
    translationSelect.innerHTML = `
        <option value="">Original Language</option>
        <option value="English">English</option>
        <option value="Spanish">Spanish</option>
        <option value="French">French</option>
        <option value="German">German</option>
        <option value="Chinese">Chinese</option>
        <option value="Japanese">Japanese</option>
        <option value="Korean">Korean</option>
    `;

    const inputContainer = input.parentElement;
    inputContainer.insertBefore(translationSelect, input);

    // Store og messages so always translating original
    const originalMessages = new Map();

    async function translateMessage(text, targetLanguage) {
        try {
            const response = await fetch("http://localhost:8000/translate/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: text,
                    target_language: targetLanguage
                })
            });

            if (!response.ok) {
                throw new Error("Translation failed");
            }

            return await response.text();
        } catch (error) {
            console.error("Translation error:", error);
            return text; // Return original text if translation fails
        }
    }

    // Update translation function was enhanced by deepseek to be more efficient and readable
    async function updateTranslations(targetLanguage) {
        const messageElements = chatBox.querySelectorAll("[data-id]");
        
        for (const element of messageElements) {
            const messageId = element.dataset.id;
            const messageText = element.querySelector("div > div:last-child");
            
            if (!messageText) continue;

            if (!originalMessages.has(messageId)) {
                originalMessages.set(messageId, messageText.textContent);
            }

            const originalText = originalMessages.get(messageId);
            
            if (targetLanguage) {
                const translatedText = await translateMessage(originalText, targetLanguage);
                messageText.textContent = translatedText;
            } else {
                messageText.textContent = originalText;
            }
        }
    }

    // Add translation change handler
    translationSelect.addEventListener("change", async () => {
        const targetLanguage = translationSelect.value;
        await updateTranslations(targetLanguage);
    });

    let selectedMember = null;
    let replyTo = null;
    const chatroomId = 1;

    // Fetch message history
    try {
        const response = await fetch(`http://localhost:8000/chatrooms/${chatroomId}/messages`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error("Failed to fetch message history");
        }
        const messages = await response.json();
        console.log("Fetched message history:", messages);

        // Display message history
        messages.forEach(msg => {
            const isOwnMessage = msg.sender_id.toString() === userId;
            const bubble = createMessageBubble(
                isOwnMessage ? "You" : `User ${msg.sender_id}`,
                msg.content,
                msg.id
            );
            chatBox.appendChild(bubble);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error("Error fetching message history:", error);
    }

    // WebSocket setup
    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);

    console.log(`User ${userId}: Connected to WebSocket`);

    ws.onopen = () => {
        console.log(`User ${userId}: Connected to WebSocket`);
        // Join the chatroom
        const joinMessage = {
            type: "join_chatroom",
            chatroom_id: chatroomId
        };
        console.log(`User ${userId}: Sending join message:`, joinMessage);
        ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`User ${userId}: Received message:`, data);
        
        // Handle join confirmation
        if (data.status === "success") {
            console.log(`User ${userId}: ${data.message}`);
            return;
        }
        
        // Handle chat messages
        if (data.sender_id && data.content) {
            console.log(`User ${userId}: Processing chat message from User ${data.sender_id}`);
            const isOwnMessage = data.sender_id === userId;
            const bubble = createMessageBubble(
                isOwnMessage ? "You" : `User ${data.sender_id}`,
                data.content,
                data.message_id
            );
            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    };

    ws.onclose = () => {
        console.log(`User ${userId}: Disconnected from WebSocket`);
    };

    ws.onerror = (error) => {
        console.error(`User ${userId}: WebSocket error:`, error);
    };

    function createMessageBubble(from, text, messageId = Date.now(), replyText = null) {
        console.log(`User ${userId}: Creating message bubble - From: ${from}, Text: ${text}`);
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
            const message = {
                type: "chat_message",
                chatroom_id: chatroomId,
                content: text
            };
            console.log(`User ${userId}: Sending message:`, message);
            ws.send(JSON.stringify(message));

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
