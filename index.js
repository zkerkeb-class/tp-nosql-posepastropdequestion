// Charger les variables d'environnement en PREMIER (avant tout autre import)
// dotenv lit le fichier .env et rend les variables accessibles via process.env
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import pokemons from './schemas/pokemons.js';

import './connect.js'


const app = express();

app.use(cors()); // Permet les requêtes cross-origin (ex: frontend sur un autre port)
app.use(express.json());

app.use('/assets', express.static('assets')); // Permet d'accéder aux fichiers dans le dossier "assets" via l'URL /assets/...



app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.get('/api/pokemons', async (req, res) => {
    // Ici, vous pouvez récupérer les pokémons depuis la base de données
    const pokemonsList = await pokemons.find(); // Récupère tous les pokémons de la collection
    res.json(pokemonsList);
})

app.get('/api/pokemons/:id', async (req, res) => {
    try {
        const pokemon = await pokemons.findOne({ id: parseInt(req.params.id) });
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon non trouvé' });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du Pokémon' });
    }
})

app.get('/api/pokemons', async (req, res) => {
    try {
        const pokemon = await pokemons.findOne({ type: req.params.type });
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon non trouvé' });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du Pokémon' });
    }
})


app.post('/api/pokemons', async (req, res) => {
    // Ici, vous pouvez récupérer les pokémons depuis la base de données
    const pokemonsList = await pokemons.create(req.body); // Crée un nouveau pokémon avec les données du corps de la requête
    res.json(pokemonsList);
})

app.put('/api/pokemons/:id', async (req, res) => {
    try {
        const pokemon = await pokemons.findOneAndUpdate({ id: parseInt(req.params.id) }, req.body, { new: true });
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon non trouvé' });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du Pokémon' });
    }
})

app.delete('/api/pokemons/:id', async (req, res) => {
    try {
        const pokemon = await pokemons.findOneAndDelete({ id: parseInt(req.params.id) });
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon non trouvé' });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression du Pokémon' });
    }
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});