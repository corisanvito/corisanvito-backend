const mongoose = require('mongoose');

const cantoSchema = new mongoose.Schema({
    titolo: { type: String, required: true },
    autore: { type: String },
    categoria: { type: String },
    testo: { type: String },
    url: { type: String }, // es. "canti/nome-del-canto"
    partiture: [{ nome: String, url: String }],
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Canto', cantoSchema);