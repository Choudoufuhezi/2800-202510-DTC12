const API_URL = "https://two800-202510-dtc12-0d55.onrender.com";

function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login.html";
        throw new Error("Missing token");
    }
    return token;
}

async function apiGet(url) {
    const token = getToken();
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

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
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
    const chatList = document.getElementById("chat-list");
    chatList.innerHTML = "<p class='text-gray-500 p-4'>Loading chats...</p>";

    try {
        const familyIds = await apiGet(`${API_URL}/family/my-families`);
        chatList.innerHTML = "";

        for (const familyId of familyIds) {
            let messages = [];

            try {
                messages = await apiGet(`${API_URL}/family/${familyId}/messages`);
            } catch (err) {
                if (err.message.includes("Not Found")) {
                    try {
                        const welcomeMsg = await apiPost(`${API_URL}/family/${familyId}/messages`, {
                            text: "👋 Welcome to your new family group chat!",
                            reply_to: null
                        });
                        messages = [welcomeMsg];
                    } catch (createErr) {
                        console.warn(`Unable to create welcome message for family ${familyId}`);
                        continue;
                    }
                } else {
                    console.error(`Failed to fetch members/messages for family ${familyId}:`, err);
                    continue;
                }
            }

            const lastMessage = messages[messages.length - 1];
            const lastText = lastMessage?.text || "No messages yet";

            const row = document.createElement("div");
            row.className = "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer";
            row.addEventListener("click", () => {
                localStorage.setItem("activeGroupId", familyId);
                window.location.href = "GroupChatPage.html";
            });

            row.innerHTML = `
                <img src="https://via.placeholder.com/40" class="w-10 h-10 rounded-full mt-1" />
                <div class="flex-1">
                    <div class="font-semibold text-gray-800">Family ${familyId}</div>
                    <div class="text-sm text-gray-600 truncate">${lastText}</div>
                </div>
                <div class="text-xs text-gray-400 self-start mt-1">${messages.length} message(s)</div>
            `;

            chatList.appendChild(row);
        }
    } catch (err) {
        chatList.innerHTML = `<p class='text-red-500 px-4 py-2'>Error loading chats. Try logging in again.</p>`;
        console.error("Failed to load chat list:", err);
    }
});
