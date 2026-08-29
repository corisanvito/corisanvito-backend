const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    canto: { type: mongoose.Schema.Types.ObjectId, ref: 'Canto', required: true },
    coro: { type: mongoose.Schema.Types.ObjectId, ref: 'Coro', required: true },
    stock: { type: Number, default: 0 },
    note: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});

// Indice unico: un solo record per canto+coro
stockSchema.index({ canto: 1, coro: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);