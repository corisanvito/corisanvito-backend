const mongoose = require('mongoose');

const avvisoSchema = new mongoose.Schema({
    titolo: { type: String, required: true },
    testo: { type: String, required: true },
    coro: { type: mongoose.Schema.Types.ObjectId, ref: 'Coro' },
    autore: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Destinatari specifici
    destinatariUtenti: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    destinatariVoci: [{ type: String }], // es. ['tenore', 'basso']

    // Allegati
    allegati: [{
        nome: { type: String },
        viewLink: { type: String },
        downloadLink: { type: String },
        driveId: { type: String },
        mimeType: { type: String }
    }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Avviso', avvisoSchema);