// État du jeu
let allPokemons = [];
let currentPokemon = null;
let score = 0;
let totalAttempts = 0;
let correctAnswers = 0;
let currentAttempts = 0;
let revealedInfos = 1; // Commencer avec 1 info
let currentUser = null;
let userToken = null;
let shuffledInfos = []; // Indices mélangés pour le pokémon courant

const API_URL = 'http://localhost:3000/api/pokemons';
const AUTH_API_URL = 'http://localhost:3000/api/auth';

// Infos progressives (révélées une par une à chaque mauvaise réponse)
const progressiveInfos = [
    (p) => `Première lettre: <strong>${p.name.french.charAt(0).toUpperCase()}</strong>`,
    (p) => `Type(s): <strong>${p.type.join(', ')}</strong>`,
    (p) => `Nombre de lettres: <strong>${p.name.french.length}</strong>`,
    (p) => `HP: <strong>${p.base.HP}</strong>`,
    (p) => `Attaque: <strong>${p.base.Attack}</strong>`,
    (p) => `Défense: <strong>${p.base.Defense}</strong>`,
    (p) => `Attaque Spé: <strong>${p.base.SpecialAttack}</strong>`,
    (p) => `Défense Spé: <strong>${p.base.SpecialDefense}</strong>`,
    (p) => `Vitesse: <strong>${p.base.Speed}</strong>`,
    (p) => `ID: <strong>#${p.id}</strong>`,
];

// Fonction pour mélanger un tableau (Fisher-Yates shuffle)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialiser le jeu
async function initGame() {
    // Vérifier l'authentification
    userToken = localStorage.getItem('token');
    if (!userToken) {
        window.location.href = '/login.html';
        return;
    }

    try {
        console.log('Chargement des pokémons...');
        const response = await fetch(`${API_URL}?limit=100`);
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
            allPokemons = data.data;
            console.log(`${allPokemons.length} pokémons chargés`);
            loadUserProfile();
            nextPokemon();
        } else {
            console.error('Format de réponse inattendu:', data);
            alert('Erreur lors du chargement des pokémons');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de charger les pokémons. Assurez-vous que le serveur est en cours d\'exécution sur port 3000');
    }
}

// Charger le profil utilisateur
async function loadUserProfile() {
    try {
        const response = await fetch(`${AUTH_API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${userToken}`,
            },
        });

        if (response.ok) {
            currentUser = await response.json();
            updateUserDisplay();
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
    }
}

// Passer au pokémon suivant
function nextPokemon() {
    if (allPokemons.length === 0) {
        alert('Aucun pokémon disponible');
        return;
    }

    currentPokemon = allPokemons[Math.floor(Math.random() * allPokemons.length)];
    currentAttempts = 0;
    revealedInfos = 1; // Recommencer avec 1 seule info

    // Mélanger les indices pour un ordre aléatoire des infos
    shuffledInfos = shuffleArray(Array.from({length: progressiveInfos.length}, (_, i) => i));

    // Réinitialiser l'interface
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').disabled = false;
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('pokemonImage').innerHTML = '';
    document.getElementById('answerInput').focus();

    displayRevealedInfos();
}

// Obtenir un indice
function getHint() {
    if (!currentPokemon) return;

    if (revealedInfos < progressiveInfos.length) {
        revealedInfos++;
        displayRevealedInfos();
    } else {
        // Tous les indices sont révélés
        document.getElementById('revealedInfosPanel').innerHTML += '<div class="info-item" style="color: #999;">✅ Tous les indices sont révélés !</div>';
    }
}

// Afficher les infos progressives révélées
function displayRevealedInfos() {
    if (!currentPokemon) return;

    let infosHTML = '';
    for (let i = 0; i < revealedInfos && i < progressiveInfos.length; i++) {
        const infoIndex = shuffledInfos[i]; // Utiliser l'index mélangé
        infosHTML += `<div class="info-item">📌 ${progressiveInfos[infoIndex](currentPokemon)}</div>`;
    }

    document.getElementById('revealedInfosPanel').innerHTML = infosHTML;
}

// Vérifier la réponse
function checkAnswer() {
    if (!currentPokemon) return;

    const input = document.getElementById('answerInput').value.trim().toLowerCase();
    const correctName = currentPokemon.name.french.toLowerCase();

    currentAttempts++;
    totalAttempts++;

    const feedbackEl = document.getElementById('feedback');

    if (input === correctName) {
        correctAnswers++;
        // Bonus de points en fonction du nombre de tentatives
        let points = Math.max(10 - currentAttempts, 1);
        score += points;
        
        feedbackEl.className = 'feedback success';
        feedbackEl.innerHTML = `
            ✅ <strong>Correct !</strong> Le pokémon est <strong>${currentPokemon.name.french}</strong> !<br>
            <span style="font-size: 0.9em;">Tentatives: ${currentAttempts} | Points: <strong>+${points}</strong></span>
        `;

        // Afficher l'image du pokémon
        document.getElementById('pokemonImage').innerHTML = `
            <img src="${currentPokemon.image}" alt="${currentPokemon.name.french}" class="pokemon-img">
        `;

        document.getElementById('answerInput').disabled = true;

        // Sauvegarder les stats sur le serveur
        saveStats(true, points);
        updateScore();
    } else {
        // Révéler une nouvelle info automatiquement
        if (revealedInfos < progressiveInfos.length) {
            revealedInfos++;
            displayRevealedInfos();
        }

        feedbackEl.className = 'feedback error';
        feedbackEl.textContent = `❌ Mauvaise réponse ! ${revealedInfos < progressiveInfos.length ? `(${parseInt((revealedInfos / progressiveInfos.length) * 100)}% d'infos révélées)` : '(toutes les infos sont révélées)'}`;
    }
}

// Mettre à jour le score
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('attempts').textContent = totalAttempts;
    
    const winRate = totalAttempts > 0 
        ? Math.round((correctAnswers / totalAttempts) * 100)
        : 0;
    document.getElementById('winRate').textContent = winRate + '%';
}

// Mettre à jour l'affichage du profil utilisateur
function updateUserDisplay() {
    if (currentUser) {
        let userDisplay = document.querySelector('.user-info');
        if (!userDisplay) {
            userDisplay = document.createElement('div');
            userDisplay.className = 'user-info';
            document.querySelector('header').appendChild(userDisplay);
        }
        userDisplay.innerHTML = `
            <span>👤 ${currentUser.username}</span>
            <a href="/profile.html">📊 Profil</a>
            <button onclick="handleLogout()" class="btn-logout">🚪 Déconnexion</button>
        `;
    }
}

// Sauvegarder les stats sur le serveur
async function saveStats(correct = false, pointsGained = 0) {
    if (!userToken || !currentUser) return;

    try {
        const response = await fetch(`${AUTH_API_URL}/stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                correctAnswers: correct ? 1 : 0,
                totalAttempts: currentAttempts,
                pointsGained,
                correct,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Stats sauvegardées:', data);
        } else {
            console.error('Erreur lors de la sauvegarde des stats:', response.status);
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des stats:', error);
    }
}

// Déconnexion
function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
    }
}

// Gestion du clavier (Entrée pour valider)
document.addEventListener('DOMContentLoaded', () => {
    const answerInput = document.getElementById('answerInput');
    
    if (answerInput) {
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !answerInput.disabled) {
                checkAnswer();
            }
        });
    }

    // Initialiser le jeu
    initGame();
});

// Bonus: afficher le nom caché progressivement
function revealName() {
    if (!currentPokemon) return;

    const name = currentPokemon.name.french;
    let revealed = '';

    for (let i = 0; i < name.length; i++) {
        if (Math.random() > 0.3) {
            revealed += '_';
        } else {
            revealed += name[i];
        }
    }

    return revealed;
}
// Déconnexion
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}