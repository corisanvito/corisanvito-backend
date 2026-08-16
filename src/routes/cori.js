const express = require('express');
const router = express.Router();
const Coro = require('../models/Coro');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /cori — lista tutti i cori
router.get('/', auth, async (req, res) => {
    try {
        const cori = await Coro.find();
        res.json(cori);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /cori — crea coro (solo direttore)
router.post('/', auth, roles('direttore'), async (req, res) => {
    try {
        const { nome, descrizione } = req.body;
        const coro = new Coro({ nome, descrizione });
        await coro.save();
        res.status(201).json(coro);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /cori/:id — modifica coro (solo direttore)
router.patch('/:id', auth, roles('direttore'), async (req, res) => {
    try {
        const coro = await Coro.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!coro) return res.status(404).json({ message: 'Coro non trovato' });
        res.json(coro);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /cori/:id — elimina coro (solo direttore)
router.delete('/:id', auth, roles('direttore'), async (req, res) => {
    try {
        await Coro.findByIdAndDelete(req.params.id);
        res.json({ message: 'Coro eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// ROUTE TEMPORANEA — rimuovila dopo!
router.post('/setup', async (req, res) => {
    try {
        const cori = [
            { nome: 'Coro delle 10' },
            { nome: 'Coro delle 11:15' },
            { nome: 'Coro Estivo' }
        ];
        await Coro.insertMany(cori);
        res.json({ message: 'Cori creati!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;