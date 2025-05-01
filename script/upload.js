function showSuccessPopup() {
    const successPopup = document.getElementById('successPopup');
    successPopup.classList.remove('hidden');

    setTimeout(() => {
        successPopup.classList.add('hidden');
    }, 3000); // Hide after 3 seconds
}
