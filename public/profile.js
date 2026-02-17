const API_URL = 'http://localhost:3000/api/auth';

// Charger le profil au démarrage
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    loadProfile();
});

// Charger et afficher le profil
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
            throw new Error('Erreur lors du chargement du profil');
        }

        const user = await response.json();
        displayProfile(user);
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('profileContent').innerHTML = `
            <div class="error">❌ ${error.message}</div>
        `;
    }
}

// Afficher le profil et les stats
function displayProfile(user) {
    const stats = user.gameStats;
    const createdDate = new Date(user.createdAt).toLocaleDateString('fr-FR');
    
    // Calcul des achievements
    const achievements = getAchievements(stats);
    
    const html = `
        <div class="card">
            <div class="profile-header">
                <div class="username">👤 ${user.username}</div>
                <div class="member-since">Membre depuis le ${createdDate}</div>
            </div>

            <div class="stats-grid">
                <div class="mini-stat">
                    <span class="mini-stat-label">Score Total</span>
                    <span class="mini-stat-value">${stats.totalScore}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">Pokémons Trouvés</span>
                    <span class="mini-stat-value">${stats.correctAnswers}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">Tentatives</span>
                    <span class="mini-stat-value">${stats.totalAttempts}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">Taux de Réussite</span>
                    <span class="mini-stat-value">${stats.winrate}%</span>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-title">📊 Statistiques Détaillées</div>
            
            <div class="stat-group">
                <span class="stat-label">Pokémons Trouvés</span>
                <span class="stat-value success">${stats.correctAnswers}</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${Math.min(stats.correctAnswers, 100)}%">
                        ${stats.correctAnswers}
                    </div>
                </div>
            </div>

            <div class="stat-group">
                <span class="stat-label">Taux de Réussite</span>
                <span class="stat-value">${stats.winrate}%</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${stats.winrate}%">
                        ${stats.winrate}%
                    </div>
                </div>
            </div>

            <div class="stat-group">
                <span class="stat-label">Essais Moyens par Pokémon</span>
                <span class="stat-value warning">${stats.averageAttemptsPerPokemon.toFixed(1)}</span>
            </div>

            <div class="stat-group">
                <span class="stat-label">Meilleure Série</span>
                <span class="stat-value success">${stats.bestStreak}</span>
            </div>

            <div class="stat-group">
                <span class="stat-label">Série Actuelle</span>
                <span class="stat-value">${stats.streakCorrect}</span>
            </div>

            ${stats.lastGameDate ? `
                <div class="stat-group">
                    <span class="stat-label">Dernière Partie</span>
                    <span class="stat-value">${new Date(stats.lastGameDate).toLocaleDateString('fr-FR')}</span>
                </div>
            ` : ''}
        </div>
    `;

    // Ajouter les achievements
    if (achievements.length > 0) {
        const achievementsHTML = achievements.map(a => `
            <div class="achievement">
                <div class="achievement-title">${a.title}</div>
                <div class="achievement-desc">${a.desc}</div>
            </div>
        `).join('');

        document.getElementById('profileContent').innerHTML += `
            <div class="achievement-section" style="grid-column: 1 / -1;">
                <div class="card">
                    <div class="card-title">🏆 Accomplissements</div>
                    ${achievementsHTML}
                </div>
            </div>
        `;
    }

    document.getElementById('profileContent').innerHTML = html;
}

// Déterminer les achievements
function getAchievements(stats) {
    const achievements = [];

    if (stats.correctAnswers >= 10) {
        achievements.push({
            title: '🥉 Novice',
            desc: 'Trouvé 10 pokémons',
        });
    }

    if (stats.correctAnswers >= 25) {
        achievements.push({
            title: '🥈 Confirmé',
            desc: 'Trouvé 25 pokémons',
        });
    }

    if (stats.correctAnswers >= 50) {
        achievements.push({
            title: '🥇 Champion',
            desc: 'Trouvé 50 pokémons',
        });
    }

    if (stats.winrate >= 80) {
        achievements.push({
            title: '🎯 Tireur d\'Elite',
            desc: 'Taux de réussite 80% ou plus',
        });
    }

    if (stats.bestStreak >= 5) {
        achievements.push({
            title: '🔥 En Feu',
            desc: 'Meilleure série de 5 pokémons',
        });
    }

    if (stats.bestStreak >= 10) {
        achievements.push({
            title: '⚡ Infaillible',
            desc: 'Meilleure série de 10 pokémons',
        });
    }

    if (stats.averageAttemptsPerPokemon <= 1.5) {
        achievements.push({
            title: '⚡ Éclair',
            desc: 'Moyenne de 1.5 essai par pokémon',
        });
    }

    if (stats.totalScore >= 1000) {
        achievements.push({
            title: '💎 Maître',
            desc: 'Score total de 1000 points',
        });
    }

    return achievements;
}

// Déconnexion
function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
    }
}
