document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const codeInput = document.getElementById("inviteCode");
        const inviteCode = codeInput.value.trim();

        if (inviteCode.length !== 6) {
            alert("Please enter a valid 6-digit invite code.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("You're not logged in. Please log in first.");
                return;
            }

            const response = await fetch("/family/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ code: inviteCode })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Successfully joined the family!");
                window.location.href = "family-groups.html";
            } else {
                alert(result.detail || "Failed to join family.");
            }
        } catch (error) {
            console.error("Error joining family:", error);
            alert("Something went wrong. Try again later.");
        }
    });
});
