function showSuccessPopup() {
    const family = document.getElementById("familyGroup").value;
    const member = document.getElementById("memberName").value;
    const category = document.getElementById("memoryCategory").value;

    if (!family || !member || !category) {
        alert("Please select family, member, and category before uploading.");
        return;
    }

    // Show modal
    const modal = document.getEleme ntById("successModal");
    modal.classList.remove("hidden");

    // Optional: Update modal content
    document.getElementById("successMessage").textContent =
        `Memory uploaded to ${capitalize(family)} → ${capitalize(member)} → ${capitalize(category)}!`;

    // Setup View Memories button to redirect to memories.html (or category page)
    const viewBtn = document.getElementById("viewMemoriesBtn");
    viewBtn.onclick = () => {
        window.location.href = `memories.html?member=${member}&category=${category}&family=${family}`;
    };
}

function closeModal() {
    document.getElementById("successModal").classList.add("hidden");
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replaceAll("-", " ");
}


