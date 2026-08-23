// --- STATE MANAGEMENT ---
let categories = JSON.parse(localStorage.getItem('atmora_categories')) || ["Arme 1H", "Arme 2H", "Armure Lourde", "Armure Légère", "Alchimie"];
let recipes = JSON.parse(localStorage.getItem('atmora_recipes')) || [];
let dbItems = []; 
let isDoublonMode = false;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    updateCategorySelect();
    renderRecipes();
    setupAutocomplete();
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
        if (item.getAttribute('onclick').includes(tabId)) {
            item.classList.remove('text-gray-300');
            item.classList.add('bg-[#313244]', 'text-white');
        }
    });

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.classList.add('block');
    }

    if (tabId === 'tab-create-recipe') {
        document.getElementById('recipe-form').reset();
        document.getElementById('recipe-id').value = '';
        document.getElementById('recipe-form-title').innerText = "Créer une Recette";
    }
}

// --- CATEGORIES LOGIC ---
const categoryForm = document.getElementById('category-form');
const categoryList = document.getElementById('category-list');
const recipeCategorySelect = document.getElementById('recipe-category');
const filterCategorySelect = document.getElementById('filter-category');

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
    filterCategorySelect.innerHTML = '<option value="">Toutes catégories</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        recipeCategorySelect.appendChild(opt);
        
        const opt2 = document.createElement('option');
        opt2.value = cat;
        opt2.innerText = cat;
        filterCategorySelect.appendChild(opt2);
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

function getFieldData(prefix) {
    const name = document.getElementById(prefix + '-name').value.trim();
    const id = document.getElementById(prefix + '-id').value.trim();
    const qty = document.getElementById(prefix + '-qty').value;
    if(name || id) {
        return { name, id, qty: parseInt(qty) || 1 };
    }
    return null;
}

function setFieldData(prefix, data) {
    document.getElementById(prefix + '-name').value = data ? data.name : '';
    document.getElementById(prefix + '-id').value = data ? data.id : '';
    document.getElementById(prefix + '-qty').value = data ? data.qty : '';
}

recipeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const recipeId = document.getElementById('recipe-id').value;
    const name = document.getElementById('recipe-name').value.trim();
    const category = document.getElementById('recipe-category').value;
    
    const ing1 = getFieldData('ing1');
    const ing2 = getFieldData('ing2');
    const ing3 = getFieldData('ing3');
    
    const resMed = getFieldData('res-med');
    const resNorm = getFieldData('res-norm');
    const resSup = getFieldData('res-sup');

    if(!ing1) {
        alert("L'ingrédient 1 est requis.");
        return;
    }
    if(!resMed && !resNorm && !resSup) {
        alert("Au moins un résultat (Médiocre, Normal ou Supérieur) est requis.");
        return;
    }

    const recipe = {
        id: recipeId ? recipeId : Date.now().toString(),
        name,
        category,
        ingredients: [ing1, ing2, ing3].filter(i => i !== null),
        results: {
            med: resMed,
            norm: resNorm,
            sup: resSup
        }
    };

    if(recipeId) {
        const index = recipes.findIndex(r => r.id === recipeId);
        if(index > -1) recipes[index] = recipe;
    } else {
        recipes.push(recipe);
    }

    saveRecipes();
    renderRecipes();
    showTab('tab-recipes');
});

function toggleDoublonSearch() {
    isDoublonMode = !isDoublonMode;
    const container = document.getElementById('doublon-container');
    if(isDoublonMode) {
        container.classList.remove('hidden');
        document.getElementById('doublon-search').focus();
    } else {
        container.classList.add('hidden');
        document.getElementById('doublon-search').value = '';
    }
    renderRecipes();
}

function renderRecipes() {
    recipeTableBody.innerHTML = '';
    const filterTxt = recipeSearch.value.toLowerCase();
    const filterCat = filterCategorySelect.value;
    const doublonTxt = document.getElementById('doublon-search').value.toLowerCase().trim();
    
    recipes.forEach(recipe => {
        // Text Filter
        if(filterTxt && !recipe.name.toLowerCase().includes(filterTxt)) return;
        // Category Filter
        if(filterCat && recipe.category !== filterCat) return;
        
        // Doublon Filter (Check if doublonTxt matches any Result ID)
        if(isDoublonMode && doublonTxt) {
            let matchDoublon = false;
            const res = recipe.results;
            if(res.med && res.med.id.toLowerCase().includes(doublonTxt)) matchDoublon = true;
            if(res.norm && res.norm.id.toLowerCase().includes(doublonTxt)) matchDoublon = true;
            if(res.sup && res.sup.id.toLowerCase().includes(doublonTxt)) matchDoublon = true;
            if(!matchDoublon) return;
        }

        const tr = document.createElement('tr');
        tr.className = "border-b border-[#313244] hover:bg-[#313244]/30 transition-colors";
        
        // Legacy support mapping
        const ings = recipe.ingredients || [];
        const ingString = ings.map(i => `<div class="mb-1">${i.qty}x ${escapeHtml(i.name)} <span class="text-[10px] text-gray-600">${escapeHtml(i.id||'')}</span></div>`).join('');
        
        // Results string
        let resString = '';
        if(recipe.results) {
            if(recipe.results.med) resString += `<div class="text-gray-500 mb-1"><span class="w-1.5 h-1.5 inline-block rounded-full bg-gray-500 mr-1"></span>${recipe.results.med.qty}x ${escapeHtml(recipe.results.med.name)}</div>`;
            if(recipe.results.norm) resString += `<div class="text-blue-400 mb-1"><span class="w-1.5 h-1.5 inline-block rounded-full bg-blue-500 mr-1"></span>${recipe.results.norm.qty}x ${escapeHtml(recipe.results.norm.name)}</div>`;
            if(recipe.results.sup) resString += `<div class="text-yellow-500 mb-1"><span class="w-1.5 h-1.5 inline-block rounded-full bg-yellow-500 mr-1"></span>${recipe.results.sup.qty}x ${escapeHtml(recipe.results.sup.name)}</div>`;
        } else {
            resString = "<i class='text-xs text-red-500'>Ancien format</i>";
        }

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-white">
                <div class="text-base">${escapeHtml(recipe.name)}</div>
                <div class="text-[10px] text-gray-600">ID: ${recipe.id}</div>
                <div class="text-[10px] text-blue-400 mt-1"><i class="fa-brands fa-discord mr-1"></i>${escapeHtml(recipe.author || 'Anonyme')}</div>
            </td>
            <td class="px-6 py-4">
                <span class="bg-gray-800 text-gray-300 border border-gray-600 text-xs font-medium px-2.5 py-1 rounded">${escapeHtml(recipe.category)}</span>
            </td>
            <td class="px-6 py-4 text-gray-400 text-xs">
                ${ingString}
            </td>
            <td class="px-6 py-4 text-xs font-medium">
                ${resString}
            </td>
            <td class="px-6 py-4 text-right space-x-2">
                <button onclick="editRecipe('${recipe.id}')" class="text-blue-400 hover:text-blue-300 p-1"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteRecipe('${recipe.id}')" class="text-red-500 hover:text-red-400 p-1"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        recipeTableBody.appendChild(tr);
    });
}

function loginDiscord() {
    alert("C'est ici qu'intervient ton ami avec son serveur !\n\nPour l'instant, le site est sur GitHub Pages (sans base de données serveur). Pour que la connexion Discord fonctionne et sécurise l'ajout des recettes, il faudra que ton ami héberge ce site avec un backend (comme Node.js ou Firebase).");
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
    
    // Legacy support clear
    setFieldData('ing1', null); setFieldData('ing2', null); setFieldData('ing3', null);
    setFieldData('res-med', null); setFieldData('res-norm', null); setFieldData('res-sup', null);
    
    if(recipe.ingredients) {
        if(recipe.ingredients[0]) setFieldData('ing1', recipe.ingredients[0]);
        if(recipe.ingredients[1]) setFieldData('ing2', recipe.ingredients[1]);
        if(recipe.ingredients[2]) setFieldData('ing3', recipe.ingredients[2]);
    }
    if(recipe.results) {
        setFieldData('res-med', recipe.results.med);
        setFieldData('res-norm', recipe.results.norm);
        setFieldData('res-sup', recipe.results.sup);
    }
}

function saveRecipes() {
    localStorage.setItem('atmora_recipes', JSON.stringify(recipes));
}


// --- AUTOCOMPLETE LOGIC ---
function setupAutocomplete() {
    const inputs = document.querySelectorAll('.autocomplete-input');
    
    // Create shared dropdown element
    const dropdown = document.createElement('ul');
    dropdown.id = 'autocomplete-dropdown';
    dropdown.className = 'autocomplete-dropdown hidden';
    document.body.appendChild(dropdown);
    
    let activeInput = null;

    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const val = this.value.toLowerCase().trim();
            dropdown.innerHTML = '';
            
            if(!val || dbItems.length === 0) {
                dropdown.classList.add('hidden');
                return;
            }
            
            activeInput = this;
            const rect = this.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
            dropdown.style.left = (rect.left + window.scrollX) + 'px';
            dropdown.style.width = rect.width + 'px';
            dropdown.classList.remove('hidden');
            
            let count = 0;
            for(let i = 0; i < dbItems.length; i++) {
                const item = dbItems[i];
                const itemName = (item.name || item.Name || item.FULL || "").toLowerCase();
                const formid = item.formId || item.FormID || item.id || "";
                
                if(itemName.includes(val) || formid.toLowerCase().includes(val)) {
                    const li = document.createElement('li');
                    li.className = 'autocomplete-item text-gray-300';
                    li.innerHTML = `<div class="font-bold text-white">${escapeHtml(item.name || item.FULL)}</div><div class="text-blue-400">${escapeHtml(formid)} <span class="text-gray-600">- ${escapeHtml(item.editorId || '')}</span></div>`;
                    
                    li.addEventListener('click', () => {
                        activeInput.value = item.name || item.FULL;
                        // Find the sibling ID input based on activeInput ID
                        // Format: ing1-name -> ing1-id
                        const prefix = activeInput.id.replace('-name', '');
                        const idInput = document.getElementById(prefix + '-id');
                        if(idInput) idInput.value = formid;
                        
                        dropdown.classList.add('hidden');
                    });
                    
                    dropdown.appendChild(li);
                    count++;
                    if(count >= 15) break; // limit suggestions
                }
            }
            if(count === 0) {
                const li = document.createElement('li');
                li.className = 'autocomplete-item text-gray-500 text-center italic';
                li.innerText = 'Aucun résultat';
                dropdown.appendChild(li);
            }
        });
        
        // Hide on blur, timeout to allow click on item
        input.addEventListener('blur', () => {
            setTimeout(() => { dropdown.classList.add('hidden'); }, 200);
        });
    });
}


// --- JSON DATABASE LOGIC ---
const jsonUpload = document.getElementById('json-upload');
const jsonFilename = document.getElementById('json-filename');
const jsonStatusDot = document.getElementById('json-status-dot');
const dbSearch = document.getElementById('db-search');
const dbResults = document.getElementById('db-results');
const dbSummary = document.getElementById('db-summary');

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
    reader.readAsText(file, 'windows-1252');
});

dbSearch.addEventListener('input', renderDbResults);

function renderDbResults() {
    const filter = dbSearch.value.toLowerCase().trim();
    dbSummary.classList.add('hidden');
    
    if(dbItems.length === 0) return;
    
    dbResults.innerHTML = '';
    
    if(!filter) {
        dbResults.innerHTML = '<div class="text-center text-gray-500 mt-10">Entrez un nom ou ID pour chercher (Base chargée: '+dbItems.length+' items).</div>';
        return;
    }

    const maxResults = 300;
    let count = 0;
    
    for(let i = 0; i < dbItems.length; i++) {
        const item = dbItems[i];
        const str = JSON.stringify(item).toLowerCase();
        
        if(str.includes(filter)) {
            const name = item.name || item.Name || item.FULL || "Inconnu";
            const formid = item.formId || item.FormID || item.id || "N/A";
            const plugin = item.plugin || item.File || "N/A";
            const editorId = item.editorId || item.EditorID || "";
            
            if (count < maxResults) {
                const div = document.createElement('div');
                div.className = "font-mono text-xs bg-[#11111a] p-3 rounded border border-gray-800 text-gray-400 mb-2 overflow-hidden";
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
            }
            count++;
        }
    }
    
    dbSummary.classList.remove('hidden');
    dbSummary.innerHTML = `<i class="fa-solid fa-list mr-1"></i> ${count} résultat(s) trouvé(s) pour "${escapeHtml(filter)}"`;
    
    if(count === 0) {
        dbResults.innerHTML = '<div class="text-center text-gray-500 mt-10">Aucun résultat trouvé.</div>';
    } else if(count > maxResults) {
        const limit = document.createElement('div');
        limit.className = "text-center text-xs text-yellow-500 mt-4";
        limit.innerText = `... et ${count - maxResults} autres résultats masqués. Affinez la recherche.`;
        dbResults.appendChild(limit);
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
    const data = { categories, recipes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atmora_crafts_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
