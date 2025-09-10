let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        navbar.classList.add('navbar-hide');
    } else {
        navbar.classList.remove('navbar-hide');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; 
});

const searchInput = document.getElementById("searchInput");
const recipeCards = document.querySelectorAll(".recipe-template");

// Get modal
const modal = document.getElementById("recipeModal");
const closeBtn = document.querySelector(".close");

// Debounce function to limit how often the search runs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to perform the search
function performSearch() {
    const filter = searchInput.value.toLowerCase().trim();
    let matches = 0;

    recipeCards.forEach(card => {
        const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
        const desc = card.querySelector("p")?.textContent.toLowerCase() || "";

        if (!filter) {
            card.style.display = ""; // reset to normal when search is empty
            matches++;
        } else if (title.includes(filter) || desc.includes(filter)) {
            card.style.display = ""; // show matching
            matches++;
        } else {
            card.style.display = "none"; // hide non-matching
        }
    });

    // Shrink to 50% only while a search term is active and there are matches
    const cardsContainer = document.querySelector(".recipe-container") || recipeCards[0]?.parentElement;
    if (cardsContainer) {
        if (filter && matches > 0) {
            cardsContainer.classList.add("search-active");
        } else {
            cardsContainer.classList.remove("search-active");
        }
    }
}

// Add input event listener with debouncing
searchInput.addEventListener("input", debounce(performSearch, 300));

let recipesData = [];

function setUpRecipeIds() {
    document.querySelectorAll(".recipe-template").forEach((card, i) => {
        card.dataset.recipeId = String(i);
    });
}

async function loadRecipes() {
    // Prefer network fetch when served over http(s)
    if (location.protocol === 'http:' || location.protocol === 'https:') {
        try {
            const res = await fetch('./recipes.json?nocache=' + Date.now());
            if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
            return await res.json();
        } catch (err) {
            console.warn('Fetch failed, falling back to inline JSON:', err);
        }
    } else {
        console.warn('Running from file:// — Chrome blocks fetch for local files. Using inline JSON fallback if provided.');
    }

    const inline = document.getElementById('recipesDataJson');
    if (inline && inline.textContent.trim()) {
        try { 
            return JSON.parse(inline.textContent); 
        } catch(e){ 
            console.error('Invalid inline JSON in #recipesDataJson:', e); 
        }
    }
    
    // If no data is available, create fallback data based on the HTML content
    console.warn('No recipe data found - creating fallback data from DOM');
    const fallbackData = [];
    document.querySelectorAll(".recipe-template").forEach(card => {
        const title = card.querySelector("h3")?.textContent?.trim() || 'Recipe';
        const desc = card.querySelector("p")?.textContent?.trim() || 'Details coming soon.';
        
        fallbackData.push({
            title: title,
            description: desc,
            ingredients: ["Ingredient details not available"],
            steps: ["Step-by-step instructions not available"],
            nutrition: {
                "Nutritional Info": "Not available"
            }
        });
    });
    
    return fallbackData;
}

function openRecipeFromCard(card) {
    const idx = Number(card?.dataset?.recipeId);
    const recipe = recipesData[idx];

    if (!recipe) {
        console.error('No recipe data available for index', idx);
        return;
    }

    document.getElementById("modalTitle").innerText = recipe.title || '';
    document.getElementById("modalDescription").innerText = recipe.description || '';

    const ingredientsList = document.getElementById("modalIngredients");
    ingredientsList.innerHTML = "";
    (recipe.ingredients || []).forEach(ing => {
        const li = document.createElement("li");
        li.textContent = ing;
        ingredientsList.appendChild(li);
    });

    const stepsList = document.getElementById("modalSteps");
    stepsList.innerHTML = "";
    (recipe.steps || []).forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        stepsList.appendChild(li);
    });

    const nutritionTable = document.getElementById("modalNutrition");
    nutritionTable.innerHTML = "<tr><th>Nutrient</th><th>Amount</th></tr>";
    const nutrition = recipe.nutrition || {};
    Object.keys(nutrition).forEach(nutrient => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${nutrient}</td><td>${nutrition[nutrient]}</td>`;
        nutritionTable.appendChild(row);
    });

    modal.style.display = "block";
}

// Initialize the application
async function initApp() {
    setUpRecipeIds();
    recipesData = await loadRecipes();
    
    document.querySelectorAll(".recipe-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.currentTarget.closest(".recipe-template");
            openRecipeFromCard(card);
        });
    });
}

// Start the application
initApp();

// Close modal when clicking X
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// Close modal when clicking outside
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        modal.style.display = "none";
    }
});

// Get meal type buttons
const breakfastBtn = document.querySelector(".breakfast");
const lunchBtn = document.querySelector(".lunch");
const dinnerBtn = document.querySelector(".Dinner");

// Add event listeners to meal type buttons
breakfastBtn.addEventListener("click", () => filterByMealType("breakfast"));
lunchBtn.addEventListener("click", () => filterByMealType("lunch"));
dinnerBtn.addEventListener("click", () => filterByMealType("dinner"));

// Function to filter recipes by meal type and show only 2
function filterByMealType(mealType) {
    // First reset all recipes to be visible
    recipeCards.forEach(card => {
        card.style.display = "";
    });
    
    // Get all visible recipe cards
    const visibleCards = Array.from(recipeCards).filter(card => 
        card.style.display !== "none"
    );
    
    let matchingRecipes = 0;
    recipeCards.forEach(card => {
        const idx = Number(card.dataset.recipeId);
        const recipe = recipesData[idx];
        
        if (recipe.mealType === mealType && matchingRecipes < 2) {
            card.style.display = "";
            matchingRecipes++;
        } else {
            card.style.display = "none";
        }
    });
}

// Ensure the parent of cards behaves as a flex container
const cardsContainer = document.querySelector(".recipe-container") || recipeCards[0]?.parentElement;
if (cardsContainer && !cardsContainer.classList.contains("recipe-container")) {
    cardsContainer.classList.add("recipe-container");
}