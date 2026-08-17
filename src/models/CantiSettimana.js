const mongoose = require('mongoose');

const cantoSettimanaSchema = new mongoose.Schema({
    coro: { type: mongoose.Schema.Types.ObjectId, ref: 'Coro', required: true },
    tipo: {
        type: String,
        enum: ['domenica', 'nuovo', 'tempo_forte'],
        required: true
    },
    titolo: { type: String, required: true },
    link: { type: String }, // link alla pagina del canto sul sito
    indicazione: { type: String }, // es. "Ingresso", "Offertorio" — solo per domenica
    tempoForte: { type: String }, // es. "Avvento" — solo per tempo_forte
    dataDomenica: { type: Date }, // solo per tipo "domenica"
    attivo: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CantoSettimana', cantoSettimanaSchema);