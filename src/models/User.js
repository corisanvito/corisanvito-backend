const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cognome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ruolo: {
        type: String,
        enum: ['direttore', 'responsabile', 'corista', 'strumentista'],
        required: true
    },
    coro: { type: mongoose.Schema.Types.ObjectId, ref: 'Coro' },
    attivo: { type: Boolean, default: false }, // attivato dal direttore
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);