const mongoose = require('mongoose');

const avvisoSchema = new mongoose.Schema({
    titolo: { type: String, required: true },
    testo: { type: String, required: true },
    coro: { type: mongoose.Schema.Types.ObjectId, ref: 'Coro' }, // null = tutti i cori
    autore: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Avviso', avvisoSchema);