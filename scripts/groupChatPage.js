document.addEventListener("DOMContentLoaded", () => {
    const chat = JSON.parse(localStorage.getItem("activeChat"));
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
        const bubble = document.createElement("div");
        bubble.className = `flex ${msg.from === "You" ? "justify-end" : "justify-start"}`;

        const content = document.createElement("div");
        content.className = `${msg.from === "You" ? "bg-blue-100" : "bg-gray-200"} text-gray-800 px-4 py-2 rounded-lg max-w-xs shadow`;
        content.textContent = msg.text;

        bubble.appendChild(content);
        chatBox.appendChild(bubble);
    });

    // Sending new messages
    const input = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        const bubble = document.createElement("div");
        bubble.className = "flex justify-end";
        const content = document.createElement("div");
        content.className = "bg-blue-100 text-gray-800 px-4 py-2 rounded-lg max-w-xs shadow";
        content.textContent = text;

        bubble.appendChild(content);
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
        input.value = "";
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });
});
