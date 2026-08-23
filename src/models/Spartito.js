const mongoose = require('mongoose');

const spartitoSchema = new mongoose.Schema({
    canto: { type: mongoose.Schema.Types.ObjectId, ref: 'Canto', required: true },
    tonalita: { type: String },
    strumenti: [{ type: String }],
    file: {
        nome: { type: String },
        url: { type: String },
        driveId: { type: String },
        mimeType: { type: String }
    },
    caricatoDa: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Spartito', spartitoSchema);