const express = require('express');
const router = express.Router();
const Avviso = require('../models/Bacheca');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /bacheca — avvisi del proprio coro
router.get('/', auth, async (req, res) => {
    try {
        const query = req.utente.ruolo === 'direttore' || req.utente.ruolo === 'responsabile'
            ? {} // vedono tutto
            : { $or: [{ coro: req.utente.coro }, { coro: null }] }; // solo il loro coro + generali

        const avvisi = await Avviso.find(query)
            .populate('autore', 'nome cognome')
            .populate('coro', 'nome')
            .sort({ createdAt: -1 });

        res.json(avvisi);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /bacheca — crea avviso (solo direttore/responsabile)
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const { titolo, testo, coro } = req.body;
        const avviso = new Avviso({
            titolo,
            testo,
            coro: coro || null,
            autore: req.utente._id
        });
        await avviso.save();
        res.status(201).json(avviso);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /bacheca/:id — modifica avviso (solo direttore/responsabile)
router.patch('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const avviso = await Avviso.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!avviso) return res.status(404).json({ message: 'Avviso non trovato' });
        res.json(avviso);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /bacheca/:id — elimina avviso (solo direttore/responsabile)
router.delete('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        await Avviso.findByIdAndDelete(req.params.id);
        res.json({ message: 'Avviso eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;