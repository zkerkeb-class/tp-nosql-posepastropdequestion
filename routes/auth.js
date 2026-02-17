import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username et password requis' });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username déjà utilisé' });
        }

        // Créer l'utilisateur (le pre-save va hasher le mot de passe)
        const user = new User({ username, password });
        await user.save();

        res.status(201).json({ message: 'Utilisateur créé avec succès', username: user.username });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Erreur lors de l\'inscription' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username et password requis' });
        }

        // Vérifier que l'utilisateur existe
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Comparer le mot de passe
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Générer le JWT
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Erreur lors de la connexion' });
    }
});

// GET /api/auth/profile - Récupérer le profil et les stats (protégé)
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération du profil' });
    }
});

// POST /api/auth/stats - Sauvegarder les stats de jeu (protégé)
router.post('/stats', auth, async (req, res) => {
    try {
        const { correctAnswers, totalAttempts, pointsGained, correct } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Mettre à jour les stats
        user.gameStats.totalAttempts += totalAttempts || 0;
        
        if (correct) {
            user.gameStats.correctAnswers += 1;
            user.gameStats.streakCorrect += 1;
            user.gameStats.bestStreak = Math.max(user.gameStats.bestStreak, user.gameStats.streakCorrect);
        } else {
            user.gameStats.streakCorrect = 0;
        }

        user.gameStats.totalScore += pointsGained || 0;
        user.gameStats.lastGameDate = new Date();

        // Calculer les stats dérivées
        if (user.gameStats.correctAnswers > 0) {
            user.gameStats.averageAttemptsPerPokemon = 
                user.gameStats.totalAttempts / user.gameStats.correctAnswers;
        }

        if (user.gameStats.totalAttempts > 0) {
            user.gameStats.winrate = 
                Math.round((user.gameStats.correctAnswers / user.gameStats.totalAttempts) * 100);
        }

        await user.save();

        res.json({
            message: 'Stats mises à jour',
            gameStats: user.gameStats,
        });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Erreur lors de la sauvegarde des stats' });
    }
});

export default router;
