// Update the memory wall title using query parameters
window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);

    const family = params.get("family")?.replaceAll("-", " ") || "Unknown Family";
    const member = params.get("member")?.replaceAll("-", " ") || "Unknown Member";

    const title = document.getElementById("pageTitle");
    if (title) {
        title.textContent = `Memories of ${capitalize(member)} → ${capitalize(family)}`;
    }

    // Future: Fetch photos, recipes, and stories from backend or localStorage
    // fetchMemories(family, member);
});

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
