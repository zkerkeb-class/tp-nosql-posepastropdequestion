import express from 'express';
import pokemons from '../schemas/pokemons.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { type, sort, name } = req.query;
        const filter = {};

        if (type) {
            filter.type = type;
        }

        if (name) {
            const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
            const regex = new RegExp(escapeRegex(name), 'i');
            filter.$or = [
                { 'name.french': regex },
                { 'name.english': regex },
                { 'name.japanese': regex },
                { 'name.chinese': regex },
            ];
        }

        let query = pokemons.find(filter);

        if (sort) {
            // Supporte un champ de tri optionnel avec notation pointée et `-` pour décroissant
            // Exemples: `name.french`, `-base.HP`, `type.0`
            const dir = sort.startsWith('-') ? -1 : 1;
            const field = sort.startsWith('-') ? sort.slice(1) : sort;

            if (field && field.length > 0) {
                const sortObj = {};
                sortObj[field] = dir;
                query = query.sort(sortObj);
            }
        }

        // Pagination: page & limit
        const pageNum = Math.max(1, parseInt(req.query.page) || 1);
        const limitNum = Math.max(1, parseInt(req.query.limit) || 50);
        const skip = (pageNum - 1) * limitNum;

        // Récupérer total et page courante en parallèle
        const [total, pokemonsList] = await Promise.all([
            pokemons.countDocuments(filter),
            query.skip(skip).limit(limitNum).exec(),
        ]);

        const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 1;

        res.json({
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
            data: pokemonsList,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des Pokémons' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const pokemon = await pokemons.findOne({ id: parseInt(req.params.id) });
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon non trouvé' });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du Pokémon' });
    }
});

router.post('/', auth, async (req, res) => {
    const pokemonsList = await pokemons.create(req.body);
    res.json(pokemonsList);
});

router.put('/:id', auth, async (req, res) => {
    try {
        const pokemon = await pokemons.findOneAndUpdate({ id: parseInt(req.params.id) }, req.body, { new: true });
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon non trouvé' });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du Pokémon' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const pokemon = await pokemons.findOneAndDelete({ id: parseInt(req.params.id) });
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon non trouvé' });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression du Pokémon' });
    }
});

export default router;
