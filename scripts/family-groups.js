document.addEventListener("DOMContentLoaded", () => {
    fetchFamilyGroups();

    const createBtn = document.getElementById("createFamilyBtn");
    if (createBtn) {
        createBtn.addEventListener("click", async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("You're not logged in.");
                return;
            }

            try {
                const response = await fetch("http://localhost:3000/family/create", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    alert("Family group created!");
                    location.reload(); // reload to show updated group list
                } else {
                    const data = await response.json();
                    alert(data.detail || "Failed to create family group.");
                }
            } catch (error) {
                console.error("Error creating family:", error);
                alert("Something went wrong.");
            }
        });
    }
});

async function fetchFamilyGroups() {
    const container = document.getElementById("familyGroupsContainer");
    container.innerHTML = "<p class='text-gray-500'>Loading family groups...</p>";

    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/family/groups", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 401 || response.status === 403) {
            alert("Session expired. Please log in again.");
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();
        displayFamilyGroups(data);
    } catch (error) {
        console.error("Failed to fetch family groups:", error);
        container.innerHTML = "<p class='text-red-500'>Failed to load family groups. Try again later.</p>";
    }
}

function displayFamilyGroups(groups) {
    const container = document.getElementById("familyGroupsContainer");
    container.innerHTML = "";

    if (!groups.length) {
        container.innerHTML = "<p class='text-gray-500 text-center'>No family groups found.</p>";
        return;
    }

    groups.forEach((group) => {
        const card = document.createElement("a");
        card.href = "family-members.html"; // Can be made dynamic with group.id
        card.className =
            "block p-4 border rounded-lg shadow bg-white hover:shadow-md hover:bg-indigo-50 transition";

        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">${group.family_name}</h3>
                    <p class="text-sm text-gray-600 mt-1">Code: ${group.invite_code}</p>
                </div>
                <i class="fas fa-chevron-right text-indigo-600"></i>
            </div>
        `;

        container.appendChild(card);
    });
}
