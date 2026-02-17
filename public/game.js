// État du jeu
let allPokemons = [];
let currentPokemon = null;
let score = 0;
let totalAttempts = 0;
let correctAnswers = 0;
let currentAttempts = 0;
let hintsUsed = 0;
let maxHints = 3;
let currentUser = null;
let userToken = null;

const API_URL = 'http://localhost:3000/api/pokemons';
const AUTH_API_URL = 'http://localhost:3000/api/auth';

// Indices disponibles par étape
const hints = [
    { text: 'Indice: ', getReason: (p) => `La première lettre est "${p.name.french.charAt(0).toUpperCase()}"` },
    { text: 'Indice: ', getReason: (p) => `Le pokémon a ${p.type.length} type(s): ${p.type.join(', ')}` },
    { text: 'Indice: ', getReason: (p) => `Le nom complet a ${p.name.french.length} lettres` },
];

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
    hintsUsed = 0;

    // Réinitialiser l'interface
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').disabled = false;
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('hintText').textContent = '';
    document.getElementById('btnHint').disabled = false;
    document.getElementById('answerInput').focus();

    displayStats();
}

// Afficher les stats du pokémon courant
function displayStats() {
    if (!currentPokemon) return;

    const { id, type, base, name } = currentPokemon;
    const maxStat = 150; // Valeur max pour les barres

    document.getElementById('statId').textContent = `#${id}`;
    document.getElementById('statType').textContent = type.join(', ');
    
    document.getElementById('statHP').textContent = base.HP;
    document.getElementById('barHP').style.width = (base.HP / maxStat) * 100 + '%';

    document.getElementById('statAttack').textContent = base.Attack;
    document.getElementById('barAttack').style.width = (base.Attack / maxStat) * 100 + '%';

    document.getElementById('statDefense').textContent = base.Defense;
    document.getElementById('barDefense').style.width = (base.Defense / maxStat) * 100 + '%';

    document.getElementById('statSpA').textContent = base.SpecialAttack;
    document.getElementById('barSpA').style.width = (base.SpecialAttack / maxStat) * 100 + '%';

    document.getElementById('statSpD').textContent = base.SpecialDefense;
    document.getElementById('barSpD').style.width = (base.SpecialDefense / maxStat) * 100 + '%';

    document.getElementById('statSpeed').textContent = base.Speed;
    document.getElementById('barSpeed').style.width = (base.Speed / maxStat) * 100 + '%';
}

// Obtenir un indice
function getHint() {
    if (!currentPokemon) return;

    if (hintsUsed >= maxHints) {
        document.getElementById('hintText').textContent = '❌ Plus d\'indices disponibles !';
        return;
    }

    const hint = hints[hintsUsed];
    const hintContent = hint.getReason(currentPokemon);
    document.getElementById('hintText').textContent = hint.text + hintContent;

    hintsUsed++;

    if (hintsUsed >= maxHints) {
        document.getElementById('btnHint').disabled = true;
    }
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
            Points gagnés: <strong>+${points}</strong>
        `;

        document.getElementById('answerInput').disabled = true;
        document.getElementById('btnHint').disabled = true;

        // Sauvegarder les stats sur le serveur
        saveStats(true, points);
        updateScore();
    } else {
        feedbackEl.className = 'feedback error';
        feedbackEl.textContent = `❌ Mauvaise réponse ! Tentative ${currentAttempts}/${maxHints + 1}`;
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
