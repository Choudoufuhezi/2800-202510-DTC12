document.addEventListener("DOMContentLoaded", () => {
    const chat = JSON.parse(localStorage.getItem("activeChat"));

    function createMessageBubble(from, text) {
        const bubble = document.createElement("div");
        bubble.className = `flex ${from === "You" ? "justify-end" : "justify-start"} relative`;

        const content = document.createElement("div");
        content.className = `${from === "You" ? "bg-blue-100" : "bg-gray-200"
            } text-gray-800 px-4 py-2 rounded-lg max-w-xs shadow`;
        content.textContent = text;

        bubble.appendChild(content);

        if (from === "You") {
            // Three-dot menu button
            const menuBtn = document.createElement("button");
            menuBtn.innerHTML = "⋮";
            menuBtn.className = "ml-2 text-gray-500 hover:text-gray-800 focus:outline-none";

            // Menu box
            const menuBox = document.createElement("div");
            menuBox.className = "absolute right-0 top-full mt-2 w-32 bg-white border rounded shadow hidden z-10";
            menuBox.innerHTML = `
                <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer" onclick="alert('Reply')">Reply</div>
                <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer" onclick="alert('Edit')">Edit</div>
                <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer" onclick="alert('Delete')">Delete</div>
            `;
            menuBox.classList.add("menu-box");

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

        const bubble = createMessageBubble("You", text);
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
        input.value = "";
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });
});
