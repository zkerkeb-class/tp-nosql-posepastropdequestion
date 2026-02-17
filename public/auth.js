const API_URL = 'http://localhost:3000/api/auth';

// Passer d'un formulaire à l'autre
function switchForm(formType) {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    
    if (formType === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
    }
    
    clearFeedback();
}

// Afficher un message de feedback
function showFeedback(message, type = 'info') {
    const feedbackEl = document.getElementById('feedback');
    feedbackEl.textContent = message;
    feedbackEl.className = `feedback show ${type}`;
    
    // Masquer après 5 secondes
    setTimeout(() => {
        feedbackEl.classList.remove('show');
    }, 5000);
}

// Effacer les messages
function clearFeedback() {
    document.getElementById('feedback').classList.remove('show');
}

// Gérer la connexion
async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showFeedback('❌ Remplissez tous les champs', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            showFeedback(`❌ ${data.error}`, 'error');
            return;
        }

        // Sauvegarder le token et rediriger
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        showFeedback('✅ Connexion réussie ! Redirection...', 'success');
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);
    } catch (error) {
        console.error('Erreur:', error);
        showFeedback('❌ Erreur de connexion au serveur', 'error');
    }
}

// Gérer l'inscription
async function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const password2 = document.getElementById('registerPassword2').value;

    if (!username || !password || !password2) {
        showFeedback('❌ Remplissez tous les champs', 'error');
        return;
    }

    if (password !== password2) {
        showFeedback('❌ Les mots de passe ne correspondent pas', 'error');
        return;
    }

    if (password.length < 6) {
        showFeedback('❌ Le mot de passe doit avoir au moins 6 caractères', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            showFeedback(`❌ ${data.error}`, 'error');
            return;
        }

        showFeedback('✅ Compte créé ! Passage à la connexion...', 'success');
        
        setTimeout(() => {
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').value = '';
            switchForm('login');
            showFeedback('ℹ️ Connectez-vous avec vos identifiants', 'info');
        }, 1500);
    } catch (error) {
        console.error('Erreur:', error);
        showFeedback('❌ Erreur lors de l\'inscription', 'error');
    }
}

// Vérifier l'authentification au chargement
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Utilisateur déjà connecté, rediriger vers le jeu
        window.location.href = '/index.html';
    }
});

// Gestion du clavier (Entrée pour valider)
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm.classList.contains('active')) {
            handleLogin();
        } else if (registerForm.classList.contains('active')) {
            handleRegister();
        }
    }
});
