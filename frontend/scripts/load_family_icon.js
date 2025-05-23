import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const container = document.getElementById('familyIconContainer');
    if (!container) return;

    const res = await fetch('../components/family_icon.html');
    const html = await res.text();
    container.innerHTML = html;

    const preview = document.getElementById('familyIconPreview');
    const name = document.getElementById('familyIconName');
    const info = document.getElementById('familyIconInfo');
    const input = document.getElementById('familyIconInput');
    const uploadLabel = document.getElementById('familyIconUploadLabel');

    try {
        const [profileRes, familiesRes] = await Promise.all([
            fetch(`${API_URL}/profile/current`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${API_URL}/family/my-families`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);

        const profile = await profileRes.json();
        const families = await familiesRes.json();

        if (families.length === 0) {
            preview.src = profile.profile_picture || '';
            name.textContent = 'No Family';
            info.textContent = 'Join or create a family';
            return;
        }

        const family = families[0];
        const members = family.members || [];

        preview.src = family.family_banner || profile.profile_picture || '';
        name.textContent = family.family_name || 'Unnamed Family';
        info.textContent = `${members.length} member${members.length !== 1 ? 's' : ''}`;

        const isAdmin = members.some(
            m => m.user_id === profile.id && m.is_admin
        );

        if (isAdmin) {
            uploadLabel.classList.remove('hidden');
        }

        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = e => preview.src = e.target.result;
            reader.readAsDataURL(file);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'digital_family_vault');

            const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dz7lbivvf/image/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            const family_banner = uploadData.secure_url;

            await fetch(`${API_URL}/family/${family.id}/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ family_banner })
            });
            showToast('Family banner updated!');
        });
    } catch (err) {
        console.error('Failed to load family icon data:', err);
    }
});

function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded shadow-xl z-50';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
