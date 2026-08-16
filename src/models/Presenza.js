const mongoose = require('mongoose');

const presenzaSchema = new mongoose.Schema({
    utente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coro: { type: mongoose.Schema.Types.ObjectId, ref: 'Coro', required: true },
    tipo: { type: String, enum: ['prova', 'celebrazione'], required: true },
    data: { type: Date, required: true },
    presente: { type: Boolean, required: true },
    note: { type: String },
    registratoDa: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Presenza', presenzaSchema);