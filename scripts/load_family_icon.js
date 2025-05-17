import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        console.warn("No token, skipping icon load");
        return;
    }

    fetch("../components/family_icon.html")
        .then(res => res.text())
        .then(data => {
            const container = document.getElementById("familyIconContainer");
            if (!container) return;

            container.innerHTML = data;

            const preview = document.getElementById("familyIconPreview");
            const name = document.getElementById("familyIconName");
            const info = document.getElementById("familyIconInfo");
            const input = document.getElementById("familyIconInput");
            const uploadLabel = document.getElementById("familyIconUploadLabel");

            Promise.all([
                fetch(`${API_URL}/profile/current`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(res => res.json()),
                fetch(`${API_URL}/family/my-families`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(res => res.json())
            ])
                .then(([profileData, familyIds]) => {
                    if (familyIds.length > 0) {
                        Promise.all([
                            fetch(`${API_URL}/family/${familyIds[0]}/members`, {
                                headers: { "Authorization": `Bearer ${token}` }
                            }).then(res => res.json()),
                            fetch(`${API_URL}/family/${familyIds[0]}/messages`, {
                                headers: { "Authorization": `Bearer ${token}` }
                            }).then(res => res.json())
                        ])
                            .then(([familyData, messages]) => {
                                if (familyData.family_banner) {
                                    preview.src = familyData.family_banner;
                                } else if (profileData.profile_picture) {
                                    preview.src = profileData.profile_picture;
                                }
                                name.textContent = familyData.family_name || "My Family";
                                const memberCount = familyData.members.length;
                                const lastMessage = messages[messages.length - 1];
                                const activity = lastMessage && new Date(lastMessage.time_stamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                                    ? "Active today"
                                    : "Active recently";
                                info.textContent = `${memberCount} member${memberCount !== 1 ? 's' : ''} • ${activity}`;
                                const isAdmin = familyData.members.some(
                                    member => member.user_id === profileData.id && member.is_admin
                                );
                                if (isAdmin) {
                                    uploadLabel.classList.remove("hidden");
                                }
                            });
                    } else {
                        if (profileData.profile_picture) {
                            preview.src = profileData.profile_picture;
                        }
                        name.textContent = "My Family";
                        info.textContent = "Join a family";
                    }
                });

            input.addEventListener("change", async function () {
                const file = this.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);

                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", "digital_family_vault");

                try {
                    const response = await fetch("https://api.cloudinary.com/v1_1/dz7lbivvf/image/upload", {
                        method: "POST",
                        body: formData
                    });
                    const data = await response.json();
                    const family_banner = data.secure_url;

                    const familyIds = await fetch(`${API_URL}/family/my-families`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    }).then(res => res.json());

                    if (familyIds.length === 0) {
                        showToast("Join a family first!");
                        return;
                    }

                    await fetch(`${API_URL}/family/${familyIds[0]}/update`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ family_banner })
                    });

                    showToast("Icon updated!");
                } catch (error) {
                    showToast("Upload failed!");
                }
            });
        });

    // Toast notification
    function showToast(message) {
        let toast = document.getElementById("toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.className = "fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded shadow-lg hidden";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 3000);
    }
});