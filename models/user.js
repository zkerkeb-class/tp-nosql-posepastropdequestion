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
