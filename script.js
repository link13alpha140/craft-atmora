// --- STATE MANAGEMENT ---
let categories = JSON.parse(localStorage.getItem('atmora_categories')) || ["Arme 1H", "Arme 2H", "Armure Lourde", "Armure Légère", "Alchimie"];
let recipes = JSON.parse(localStorage.getItem('atmora_recipes')) || [];
let dbItems = []; // Not saved to localStorage to avoid quota limits

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderRecipes();
    updateCategorySelect();
    
    // Add default ingredient row if empty
    if(document.getElementById('ingredients-container').children.length === 0) {
        addIngredientRow();
    }
});

// --- NAVIGATION ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('block');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-[#313244]', 'text-white');
        item.classList.add('text-gray-300');
    });

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.classList.add('block');
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.remove('text-gray-300');
        event.currentTarget.classList.add('bg-[#313244]', 'text-white');
    }

    // specific resets
    if (tabId === 'tab-create-recipe') {
        document.getElementById('recipe-form').reset();
        document.getElementById('recipe-id').value = '';
        document.getElementById('recipe-form-title').innerText = "Créer une Recette";
        document.getElementById('ingredients-container').innerHTML = '';
        addIngredientRow();
    }
}

// --- CATEGORIES LOGIC ---
const categoryForm = document.getElementById('category-form');
const categoryList = document.getElementById('category-list');
const recipeCategorySelect = document.getElementById('recipe-category');

categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('new-category-name');
    const val = input.value.trim();
    if(val && !categories.includes(val)) {
        categories.push(val);
        saveCategories();
        renderCategories();
        updateCategorySelect();
        input.value = '';
    }
});

function renderCategories() {
    categoryList.innerHTML = '';
    categories.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = "bg-[#11111a] border border-[#313244] p-3 rounded-lg flex justify-between items-center";
        li.innerHTML = `
            <span class="text-white font-medium">${escapeHtml(cat)}</span>
            <button onclick="deleteCategory(${index})" class="text-red-500 hover:text-red-400 p-1"><i class="fa-solid fa-trash"></i></button>
        `;
        categoryList.appendChild(li);
    });
}

function deleteCategory(index) {
    if(confirm("Supprimer cette catégorie ?")) {
        categories.splice(index, 1);
        saveCategories();
        renderCategories();
        updateCategorySelect();
    }
}

function updateCategorySelect() {
    recipeCategorySelect.innerHTML = '';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        recipeCategorySelect.appendChild(opt);
    });
}

function saveCategories() {
    localStorage.setItem('atmora_categories', JSON.stringify(categories));
}

// --- RECIPES LOGIC ---
const recipeForm = document.getElementById('recipe-form');
const recipeTableBody = document.getElementById('recipe-table-body');
const recipeSearch = document.getElementById('recipe-search');

recipeSearch.addEventListener('input', renderRecipes);

function addIngredientRow(name = '', qty = 1) {
    const container = document.getElementById('ingredients-container');
    const div = document.createElement('div');
    div.className = "flex space-x-4 items-center bg-[#11111a] p-3 rounded-lg border border-[#313244] ingredient-row";
    div.innerHTML = `
        <div class="flex-1">
            <label class="block mb-1 text-xs text-gray-500">Objet (Nom ou ID)</label>
            <input type="text" required value="${escapeHtml(name)}" class="ing-name bg-[#181825] border border-[#313244] text-white text-sm rounded block w-full p-2 outline-none">
        </div>
        <div class="w-24">
            <label class="block mb-1 text-xs text-gray-500">Quantité</label>
            <input type="number" required value="${qty}" min="1" class="ing-qty bg-[#181825] border border-[#313244] text-white text-sm rounded block w-full p-2 outline-none">
        </div>
        <div class="pt-5">
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-500 hover:text-red-400 p-2"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `;
    container.appendChild(div);
}

recipeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('recipe-id').value;
    const name = document.getElementById('recipe-name').value.trim();
    const category = document.getElementById('recipe-category').value;
    
    const ingredients = [];
    document.querySelectorAll('.ingredient-row').forEach(row => {
        const ingName = row.querySelector('.ing-name').value.trim();
        const ingQty = parseInt(row.querySelector('.ing-qty').value);
        if(ingName && ingQty) {
            ingredients.push({ name: ingName, qty: ingQty });
        }
    });

    if(ingredients.length === 0) {
        alert("Ajoutez au moins un ingrédient.");
        return;
    }

    const recipe = {
        id: id ? id : Date.now().toString(),
        name,
        category,
        ingredients
    };

    if(id) {
        const index = recipes.findIndex(r => r.id === id);
        if(index > -1) recipes[index] = recipe;
    } else {
        recipes.push(recipe);
    }

    saveRecipes();
    renderRecipes();
    showTab('tab-recipes');
});

function renderRecipes() {
    recipeTableBody.innerHTML = '';
    const filter = recipeSearch.value.toLowerCase();
    
    recipes.forEach(recipe => {
        if(filter && !recipe.name.toLowerCase().includes(filter) && !recipe.category.toLowerCase().includes(filter)) return;

        const tr = document.createElement('tr');
        tr.className = "border-b border-[#313244] hover:bg-[#313244]/30 transition-colors";
        
        const ingString = recipe.ingredients.map(i => `${i.qty}x ${i.name}`).join(', ');
        
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-white flex items-center">
                <div class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center mr-3 border border-gray-700 text-gray-400"><i class="fa-solid fa-khanda"></i></div>
                ${escapeHtml(recipe.name)}
            </td>
            <td class="px-6 py-4">
                <span class="bg-gray-800 text-gray-300 border border-gray-600 text-xs font-medium px-2.5 py-1 rounded">${escapeHtml(recipe.category)}</span>
            </td>
            <td class="px-6 py-4 text-gray-400 text-xs">
                ${escapeHtml(ingString)}
            </td>
            <td class="px-6 py-4 text-right space-x-2">
                <button onclick="editRecipe('${recipe.id}')" class="text-blue-400 hover:text-blue-300 p-1"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteRecipe('${recipe.id}')" class="text-red-500 hover:text-red-400 p-1"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        recipeTableBody.appendChild(tr);
    });
}

function deleteRecipe(id) {
    if(confirm("Supprimer cette recette ?")) {
        recipes = recipes.filter(r => r.id !== id);
        saveRecipes();
        renderRecipes();
    }
}

function editRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if(!recipe) return;

    showTab('tab-create-recipe');
    document.getElementById('recipe-form-title').innerText = "Modifier la Recette";
    document.getElementById('recipe-id').value = recipe.id;
    document.getElementById('recipe-name').value = recipe.name;
    document.getElementById('recipe-category').value = recipe.category;
    
    document.getElementById('ingredients-container').innerHTML = '';
    recipe.ingredients.forEach(ing => {
        addIngredientRow(ing.name, ing.qty);
    });
}

function saveRecipes() {
    localStorage.setItem('atmora_recipes', JSON.stringify(recipes));
}


// --- JSON DATABASE LOGIC ---
const jsonUpload = document.getElementById('json-upload');
const jsonFilename = document.getElementById('json-filename');
const jsonStatusDot = document.getElementById('json-status-dot');
const dbSearch = document.getElementById('db-search');
const dbResults = document.getElementById('db-results');

jsonUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;

    jsonFilename.innerText = file.name;
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            dbItems = JSON.parse(event.target.result);
            jsonStatusDot.classList.replace('bg-red-500', 'bg-green-500');
            renderDbResults();
        } catch(err) {
            alert("Erreur de lecture du JSON. Est-ce le bon format ?");
            console.error(err);
        }
    };
    // xEdit exporte par défaut en ANSI (Windows-1252), ce qui casse les accents si on lit en UTF-8
    reader.readAsText(file, 'windows-1252');
});

dbSearch.addEventListener('input', renderDbResults);

function renderDbResults() {
    const filter = dbSearch.value.toLowerCase().trim();
    if(dbItems.length === 0) return;
    
    dbResults.innerHTML = '';
    
    if(!filter) {
        dbResults.innerHTML = '<div class="text-center text-gray-500 mt-10">Entrez un nom ou ID pour chercher (Base chargée: '+dbItems.length+' items).</div>';
        return;
    }

    const maxResults = 300; // Augmenté de 50 à 300 pour plus de confort
    let count = 0;
    
    for(let i = 0; i < dbItems.length; i++) {
        const item = dbItems[i];
        // Ensure object has properties you want to search
        const str = JSON.stringify(item).toLowerCase();
        
        if(str.includes(filter)) {
            const div = document.createElement('div');
            div.className = "font-mono text-xs bg-[#11111a] p-3 rounded border border-gray-800 text-gray-400 mb-2 overflow-hidden";
            
            // Format item nicely instead of raw JSON
            const name = item.name || item.Name || item.FULL || "Inconnu";
            const formid = item.formId || item.FormID || item.id || "N/A";
            const plugin = item.plugin || item.File || "N/A";
            const editorId = item.editorId || item.EditorID || "";
            
            div.innerHTML = `
                <div class="flex justify-between mb-1">
                    <strong class="text-white text-sm">${escapeHtml(name)}</strong>
                    <span class="text-blue-400">${escapeHtml(formid)}</span>
                </div>
                <div class="text-gray-500 flex justify-between">
                    <span>Fichier: <span class="text-green-400">${escapeHtml(plugin)}</span></span>
                    <span class="text-gray-600 text-xs">${escapeHtml(editorId)}</span>
                </div>
            `;
            dbResults.appendChild(div);
            count++;
            if(count >= maxResults) {
                const limit = document.createElement('div');
                limit.className = "text-center text-xs text-yellow-500 mt-2";
                limit.innerText = `... et plus. Affinez la recherche (Max ${maxResults} résultats affichés).`;
                dbResults.appendChild(limit);
                break;
            }
        }
    }
    
    if(count === 0) {
        dbResults.innerHTML = '<div class="text-center text-gray-500 mt-10">Aucun résultat trouvé.</div>';
    }
}

// --- UTILS ---
function escapeHtml(unsafe) {
    return (unsafe || "").toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function exportData() {
    const data = {
        categories: categories,
        recipes: recipes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atmora_crafts_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
