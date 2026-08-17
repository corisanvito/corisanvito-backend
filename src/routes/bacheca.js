const express = require('express');
const router = express.Router();
const Avviso = require('../models/Bacheca');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /bacheca
router.get('/', auth, async (req, res) => {
    try {
        let query;
        if (req.utente.ruolo === 'direttore') {
            query = {}; // vede tutto
        } else if (req.utente.ruolo === 'responsabile') {
            query = { $or: [{ coro: { $in: req.utente.cori } }, { coro: null }] };
        } else {
            query = { $or: [{ coro: { $in: req.utente.cori } }, { coro: null }] };
        }

        const avvisi = await Avviso.find(query)
            .populate('autore', 'nome cognome')
            .populate('coro', 'nome')
            .sort({ createdAt: -1 });

        res.json(avvisi);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /bacheca
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const { titolo, testo, coro } = req.body;

        // Il responsabile può pubblicare solo per i suoi cori (o per tutti con coro=null)
        if (req.utente.ruolo === 'responsabile' && coro) {
            const coriIds = req.utente.cori.map(c => c.toString());
            if (!coriIds.includes(coro)) {
                return res.status(403).json({ message: 'Non puoi pubblicare avvisi per questo coro' });
            }
        }

        const avviso = new Avviso({ titolo, testo, coro: coro || null, autore: req.utente._id });
        await avviso.save();
        res.status(201).json(avviso);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /bacheca/:id
router.patch('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const avviso = await Avviso.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!avviso) return res.status(404).json({ message: 'Avviso non trovato' });
        res.json(avviso);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /bacheca/:id
router.delete('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        await Avviso.findByIdAndDelete(req.params.id);
        res.json({ message: 'Avviso eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;