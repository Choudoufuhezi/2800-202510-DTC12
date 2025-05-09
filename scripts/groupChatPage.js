const API_URL = "https://two800-202510-dtc12-0d55.onrender.com";

// Helper: Get token from localStorage
function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No token found. Please log in.");
    }
    return token;
}

// Helper: Send GET request with auth
async function apiGet(url) {
    const token = getToken();
    const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
        const contentType = res.headers.get("content-type");
        const errorText = contentType && contentType.includes("application/json")
            ? (await res.json()).detail
            : await res.text();
        throw new Error(errorText || "GET request failed.");
    }

    return await res.json();
}


// Helper: Send POST request with auth
async function apiPost(url, payload) {
    const token = getToken();
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const contentType = res.headers.get("content-type");
        const errorText = contentType && contentType.includes("application/json")
            ? (await res.json()).detail
            : await res.text();
        throw new Error(errorText || "POST request failed.");
    }

    return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
    const groupId = localStorage.getItem("activeGroupId");
    if (!groupId) {
        window.location.href = "inbox_page.html";
        return;
    }

    const input = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");
    const chatBox = document.getElementById("chat-box");
    let replyTo = null;
    let currentUserEmail = "";

    try {
        const user = await apiGet(`${API_URL}/profile/me`);
        currentUserEmail = user.email;
    } catch (err) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/login.html";
        return;
    }

    try {
        const messages = await apiGet(`${API_URL}/family/${groupId}/messages`);
        messages.forEach(msg => {
            const bubble = createMessageBubble(
                msg.from === currentUserEmail ? "You" : msg.from,
                msg.text,
                msg.id,
                msg.reply_to ? "↪" : null
            );
            chatBox.appendChild(bubble);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        if (err.message === "Not Found") {
            console.warn(`No messages found for family ${groupId}`);

            // Auto-send welcome message
            try {
                const welcomeMsg = await apiPost(`${API_URL}/family/${groupId}/messages`, {
                    text: "👋 Welcome to your new family group chat!",
                    reply_to: null
                });

                const bubble = createMessageBubble("You", welcomeMsg.text, welcomeMsg.id);
                chatBox.appendChild(bubble);
                chatBox.scrollTop = chatBox.scrollHeight;
            } catch (sendErr) {
                console.error("Failed to send welcome message:", sendErr);
            }

        } else {
            console.error("Failed to load messages:", err);
        }
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });

    document.getElementById("cancel-reply").addEventListener("click", () => {
        replyTo = null;
        document.getElementById("reply-preview").classList.add("hidden");
    });

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        try {
            const message = await apiPost(`${API_URL}/family/${groupId}/messages`, {
                text,
                reply_to: replyTo?.messageId || null
            });

            const bubble = createMessageBubble("You", message.text, message.id, replyTo?.originalText);
            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;

            input.value = "";
            replyTo = null;
            document.getElementById("reply-preview").classList.add("hidden");
        } catch (err) {
            alert(err.message);
        }
    }

    function createMessageBubble(from, text, messageId, replyText) {
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
        return bubbleWrapper;
    }
});
