const mongoose = require('mongoose');

const cantoSchema = new mongoose.Schema({
    titolo: { type: String, required: true },
    autore: { type: String },
    categoria: { type: String }, // es. "avvento", "natale", "ordinario"
    testo: { type: String },
    accordi: { type: String },
    partiture: [{ // array di file PDF
        nome: { type: String },
        url: { type: String }
    }],
    cori: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coro' }], // repertorio
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Canto', cantoSchema);