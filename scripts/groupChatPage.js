document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === "") return;

        // Create message bubble
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
});