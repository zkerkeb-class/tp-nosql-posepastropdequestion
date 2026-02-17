const API_URL = 'http://localhost:3000/api/pokemons';
const AUTH_API_URL = 'http://localhost:3000/api/auth';

let allPokemonTypes = [];
let currentPage = 1;

// Charger au démarrage
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    loadAllTypes();
    applyFilters();

    // Event listeners
    document.getElementById('applyFilters').addEventListener('click', () => {
        currentPage = 1;
        applyFilters();
    });

    // Enter key sur recherche
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            applyFilters();
        }
    });

    // Change type/sort/limit
    document.getElementById('typeFilter').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
    document.getElementById('sortBy').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
    document.getElementById('limitInput').addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
});

// Charger tous les types disponibles
async function loadAllTypes() {
    try {
        const response = await fetch(`${API_URL}?limit=1000`);
        if (!response.ok) throw new Error('Erreur lors du chargement des types');
        
        const data = await response.json();
        const types = new Set();
        
        // Extraire tous les types uniques
        data.data.forEach(pokemon => {
            if (pokemon.type) {
                pokemon.type.forEach(t => types.add(t));
            }
        });
        
        // Remplir le select
        const typeFilter = document.getElementById('typeFilter');
        Array.from(types).sort().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });

        allPokemonTypes = Array.from(types).sort();
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Appliquer les filtres et charger les pokémons
async function applyFilters() {
    try {
        const token = localStorage.getItem('token');
        const searchInput = document.getElementById('searchInput').value.trim();
        const typeFilter = document.getElementById('typeFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        const limit = parseInt(document.getElementById('limitInput').value) || 12;

        // Construire l'URL
        let url = `${API_URL}?page=${currentPage}&limit=${limit}`;
        
        if (searchInput) {
            url += `&name=${encodeURIComponent(searchInput)}`;
        }
        
        if (typeFilter) {
            url += `&type=${encodeURIComponent(typeFilter)}`;
        }
        
        if (sortBy) {
            url += `&sort=${sortBy}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
            throw new Error('Erreur lors du chargement des pokémons');
        }

        const data = await response.json();
        displayPokemons(data.data);
        updatePaginationInfo(data.meta);
        updatePaginationControls(data.meta);

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('pokemonsGrid').innerHTML = `
            <div class="error">❌ ${error.message}</div>
        `;
    }
}

// Afficher les pokémons
function displayPokemons(pokemons) {
    const grid = document.getElementById('pokemonsGrid');
    
    if (!pokemons || pokemons.length === 0) {
        grid.innerHTML = '<div class="no-results">Aucun pokémon trouvé 😢</div>';
        return;
    }

    grid.innerHTML = pokemons.map(pokemon => `
        <div class="pokemon-card">
            <div class="pokemon-id">#${String(pokemon.id).padStart(3, '0')}</div>
            <div class="pokemon-image">
                <img src="${pokemon.image}" alt="${pokemon.name.french}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
            </div>
            <div class="pokemon-name">${pokemon.name.french}</div>
            <div class="pokemon-names">
                <small>${pokemon.name.english}</small>
            </div>
            <div class="pokemon-types">
                ${pokemon.type.map(t => `<span class="type-badge type-${t.toLowerCase()}">${t}</span>`).join('')}
            </div>
            <div class="pokemon-stats">
                <div class="stat">
                    <span class="stat-name">HP</span>
                    <span class="stat-value">${pokemon.base.HP}</span>
                </div>
                <div class="stat">
                    <span class="stat-name">ATK</span>
                    <span class="stat-value">${pokemon.base.Attack}</span>
                </div>
                <div class="stat">
                    <span class="stat-name">DEF</span>
                    <span class="stat-value">${pokemon.base.Defense}</span>
                </div>
                <div class="stat">
                    <span class="stat-name">SPE</span>
                    <span class="stat-value">${pokemon.base.Speed}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Mettre à jour les infos de résultats
function updatePaginationInfo(meta) {
    const resultsInfo = document.getElementById('resultsInfo');
    const startNum = (meta.page - 1) * meta.limit + 1;
    const endNum = Math.min(meta.page * meta.limit, meta.total);
    
    resultsInfo.textContent = `${startNum} - ${endNum} sur ${meta.total} pokémons`;
}

// Mettre à jour les contrôles de pagination
function updatePaginationControls(meta) {
    const controls = document.getElementById('paginationControls');
    let html = '';

    // Bouton précédent
    if (meta.hasPrevPage) {
        html += `<button class="btn-page" onclick="goToPage(${meta.page - 1})">← Précédent</button>`;
    } else {
        html += `<button class="btn-page" disabled>← Précédent</button>`;
    }

    // Numéros de page
    const maxButtons = 7;
    let startPage = Math.max(1, meta.page - Math.floor(maxButtons / 2));
    let endPage = Math.min(meta.totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
        html += `<button class="btn-page" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === meta.page) {
            html += `<button class="btn-page active">${i}</button>`;
        } else {
            html += `<button class="btn-page" onclick="goToPage(${i})">${i}</button>`;
        }
    }

    if (endPage < meta.totalPages) {
        if (endPage < meta.totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
        html += `<button class="btn-page" onclick="goToPage(${meta.totalPages})">${meta.totalPages}</button>`;
    }

    // Bouton suivant
    if (meta.hasNextPage) {
        html += `<button class="btn-page" onclick="goToPage(${meta.page + 1})">Suivant →</button>`;
    } else {
        html += `<button class="btn-page" disabled>Suivant →</button>`;
    }

    controls.innerHTML = html;
}

// Aller à une page
function goToPage(page) {
    currentPage = page;
    applyFilters();
    // Scroll vers le haut
    document.querySelector('.pokemons-panel').scrollTop = 0;
}

// Déconnexion
function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Gestion de la modale
function openAddModal() {
    const modal = document.getElementById('addPokemonModal');
    modal.classList.add('active');
    populateTypeSelects();
}

function closeAddModal() {
    const modal = document.getElementById('addPokemonModal');
    modal.classList.remove('active');
    document.getElementById('addPokemonForm').reset();
}

// Fermer la modale si on clique en dehors
document.addEventListener('click', (e) => {
    const modal = document.getElementById('addPokemonModal');
    if (e.target === modal) {
        closeAddModal();
    }
});

// Remplir les selects des types
function populateTypeSelects() {
    const type1Select = document.getElementById('pokemonType1');
    const type2Select = document.getElementById('pokemonType2');
    
    // Vider les selects sauf la première option
    type1Select.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '';
    type1Select.appendChild(defaultOption);
    
    // Ajouter les types
    allPokemonTypes.forEach(type => {
        const option1 = document.createElement('option');
        option1.value = type;
        option1.textContent = type;
        type1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = type;
        option2.textContent = type;
        type2Select.appendChild(option2);
    });
}

// Ajouter un pokémon
async function handleAddPokemon(event) {
    event.preventDefault();

    try {
        const token = localStorage.getItem('token');
        
        // Récupérer les données du formulaire
        const types = [];
        const type1 = document.getElementById('pokemonType1').value;
        if (type1) types.push(type1);
        const type2 = document.getElementById('pokemonType2').value;
        if (type2) types.push(type2);

        const newPokemon = {
            id: parseInt(document.getElementById('pokemonId').value),
            name: {
                french: document.getElementById('pokemonNameFR').value,
                english: document.getElementById('pokemonNameEN').value,
                japanese: document.getElementById('pokemonNameJP').value,
                chinese: document.getElementById('pokemonNameCN').value,
            },
            type: types,
            base: {
                HP: parseInt(document.getElementById('pokemonHP').value),
                Attack: parseInt(document.getElementById('pokemonAttack').value),
                Defense: parseInt(document.getElementById('pokemonDefense').value),
                SpecialAttack: parseInt(document.getElementById('pokemonSpAtk').value),
                SpecialDefense: parseInt(document.getElementById('pokemonSpDef').value),
                Speed: parseInt(document.getElementById('pokemonSpeed').value),
            },
            image: document.getElementById('pokemonImage').value || `${process.env.API_URL || 'http://localhost:3000'}/assets/pokemons/${document.getElementById('pokemonId').value}.png`,
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(newPokemon),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
        }

        const result = await response.json();
        
        // Succès
        alert(`✅ Pokémon "${result.name.french}" créé avec succès !`);
        closeAddModal();
        
        // Recharger les données
        currentPage = 1;
        applyFilters();

    } catch (error) {
        console.error('Erreur:', error);
        alert(`❌ Erreur: ${error.message}`);
    }
}

