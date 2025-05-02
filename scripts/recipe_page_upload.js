const removeRecipeEmptyMessage = document.getElementById("recipeEmptyMessage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const recipeGrid = document.getElementById("recipeGrid");
const addMoreRecipes = document.getElementById("addMoreRecipesButton");

uploadButton.addEventListener("click", () => {
    fileInput.click();
});

addMoreRecipes.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        addMoreRecipes.classList.remove('hidden');

        const reader = new FileReader();

        reader.onload = function (event) {
            // Hide empty message
            removeRecipeEmptyMessage.classList.add('hidden');

            // Create and style the image
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = "max-w-full h-auto rounded shadow";

            // Add to photo grid
            recipeGrid.appendChild(img);
        };

        reader.readAsDataURL(file);
    } 

    else {
        if (recipeGrid.children.length === 0) {
            removeRecipeEmptyMessage.classList.remove('hidden');
        }
    }
});