import jwt from 'jsonwebtoken';

/**
 * Middleware d'authentification JWT
 * Récupère le token du header Authorization: Bearer <token>
 * Ajoute l'utilisateur décodé à req.user
 */
export const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token manquant ou invalide' });
        }

        const token = authHeader.slice(7); // Retirer "Bearer "

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ajouter l'utilisateur à la requête
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};

export default auth;
