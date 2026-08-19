const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cognome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ruolo: {
        type: String,
        enum: ['admin', 'direttore', 'responsabile', 'corista', 'strumentista'],
        required: true
    },
    cori: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coro' }],
    tipoVoce: {
        type: String,
        enum: ['bianca', 'soprano', 'contralto', 'tenore', 'basso', ''],
        default: ''
    },
    dataNascita: { type: Date },
    telefono: { type: String },
    note: { type: String },
    attivo: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);