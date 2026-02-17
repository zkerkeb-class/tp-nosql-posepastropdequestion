import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

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

export default router;
