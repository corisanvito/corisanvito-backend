const mongoose = require('mongoose');

const cantoSchema = new mongoose.Schema({
    titolo: { type: String, required: true },
    autore: { type: String },
    categoria: { type: String },
    testo: { type: String },
    partiture: [{
        nome: { type: String },
        url: { type: String }
    }],
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Canto', cantoSchema);