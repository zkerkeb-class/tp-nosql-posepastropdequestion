import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    // Stats du jeu
    gameStats: {
        totalAttempts: {
            type: Number,
            default: 0,
        },
        correctAnswers: {
            type: Number,
            default: 0,
        },
        totalScore: {
            type: Number,
            default: 0,
        },
        averageAttemptsPerPokemon: {
            type: Number,
            default: 0,
        },
        winrate: {
            type: Number,
            default: 0,
        },
        lastGameDate: {
            type: Date,
            default: null,
        },
        streakCorrect: {
            type: Number,
            default: 0,
        },
        bestStreak: {
            type: Number,
            default: 0,
        },
    },
}, { timestamps: true });

// Middleware pre-save pour hasher le mot de passe avant l'enregistrement
userSchema.pre('save', async function () {
    // Ne hasher que si le mot de passe a été modifié
    if (!this.isModified('password')) {
        return;
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw new Error('Erreur lors du hachage du mot de passe');
    }
});

// Méthode pour comparer le mot de passe en clair avec le hash
userSchema.methods.comparePassword = async function (passwordToCheck) {
    return await bcrypt.compare(passwordToCheck, this.password);
};

export default mongoose.model('User', userSchema);
