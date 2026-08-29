const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const Canto = require('../models/Canto');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /stock/:coroId — lista tutti i canti con il loro stock per quel coro
router.get('/:coroId', auth, roles('admin'), async (req, res) => {
    try {
        const canti = await Canto.find().sort({ titolo: 1 });

        const stocks = await Stock.find({ coro: req.params.coroId });
        const stockMap = {};
        stocks.forEach(s => { stockMap[s.canto.toString()] = s; });

        const risultato = canti.map(c => ({
            _id: c._id,
            titolo: c.titolo,
            autore: c.autore || '',
            categoria: c.categoria || '',
            stock: stockMap[c._id.toString()]?.stock ?? 0,
            note: stockMap[c._id.toString()]?.note ?? '',
            stockId: stockMap[c._id.toString()]?._id ?? null
        }));

        res.json(risultato);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /stock/:coroId/:cantoId — aggiorna stock
router.patch('/:coroId/:cantoId', auth, roles('admin'), async (req, res) => {
    try {
        const { stock, note } = req.body;

        const record = await Stock.findOneAndUpdate(
            { canto: req.params.cantoId, coro: req.params.coroId },
            { stock, note, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        res.json(record);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;