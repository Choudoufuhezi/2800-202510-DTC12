export function showBasicUploadingModal() {
    // Modal container
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50";
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Modal content
    const modalContent = document.createElement('div');
    modalContent.className = "modal-content bg-white pt-2 pb-6 px-6 rounded shadow-lg max-w-md w-full flex flex-col items-center";
    modal.appendChild(modalContent);

    // Spinner + message
    // SVG image created by ChatGPT
    modalContent.innerHTML = `
      <div class="flex flex-col items-center py-8">
        <svg class="animate-spin h-8 w-8 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span class="ml-4 text-gray-500">Uploading your memory...</span>
      </div>
    `;
    document.body.appendChild(modal);

    return () => modal.remove();
}

// SVG image created by ChatGPT 
export function createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = "flex items-center justify-center py-12";
    spinner.innerHTML = `
      <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <span class="ml-4 text-gray-500">Loading...</span>
    `;
    return spinner;
}