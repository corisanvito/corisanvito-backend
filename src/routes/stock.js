const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const Canto = require('../models/Canto');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /stock/:coroId/export — scarica CSV dello stock
router.get('/:coroId/export', auth, roles('admin'), async (req, res) => {
    try {
        const canti = await Canto.find().sort({ titolo: 1 });

        const stocks = await Stock.find({ coro: req.params.coroId });
        const stockMap = {};
        stocks.forEach(s => { stockMap[s.canto.toString()] = s.stock; });

        const righe = ['titolo;stock;note'];
        canti.forEach(c => {
            const stock = stockMap[c._id.toString()] ?? 0;
            const nota  = stocks.find(s => s.canto.toString() === c._id.toString())?.note || '';
            righe.push(`${c.titolo};${stock};${nota}`);
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=stock-coro-${req.params.coroId}.csv`);
        res.send('\uFEFF' + righe.join('\n')); // BOM per Excel
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /stock/:coroId/:cantoId — aggiorna stock, numero libretto e/o note
router.patch('/:coroId/:cantoId', auth, roles('admin'), async (req, res) => {
    try {
        const { stock, numeroLibretto, note } = req.body;

        const aggiornamento = { updatedAt: new Date() };
        if (stock !== undefined) aggiornamento.stock = stock;
        if (numeroLibretto !== undefined) aggiornamento.numeroLibretto = numeroLibretto;
        if (note !== undefined) aggiornamento.note = note;

        const record = await Stock.findOneAndUpdate(
            { canto: req.params.cantoId, coro: req.params.coroId },
            aggiornamento,
            { upsert: true, new: true }
        );

        res.json(record);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;