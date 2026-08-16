const mongoose = require('mongoose');

const coroSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descrizione: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coro', coroSchema);