const express = require('express');
const router = express.Router();
const CantoSettimana = require('../models/CantiSettimana');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /canti-settimana/:coroId — pubblico, usato dalla homepage
router.get('/:coroId', async (req, res) => {
    try {
        const canti = await CantoSettimana.find({
            coro: req.params.coroId,
            attivo: true
        }).sort({ tipo: 1, createdAt: 1 });
        res.json(canti);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /canti-settimana — crea (solo admin)
router.post('/', auth, roles('admin', 'direttore', 'responsabile'), async (req, res) => {
    try {
        const { coro, tipo, titolo, link, indicazione, tempoForte, dataDomenica } = req.body;

        // Verifica che il coro sia tra i suoi
        const coriIds = req.utente.cori.map(c => c._id.toString());
        if (!coriIds.includes(coro)) {
            return res.status(403).json({ message: 'Non puoi gestire questo coro' });
        }

        const canto = new CantoSettimana({ coro, tipo, titolo, link, indicazione, tempoForte, dataDomenica });
        await canto.save();
        res.status(201).json(canto);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /canti-settimana/:id — elimina (solo admin)
router.delete('/:id', auth, roles('admin', 'direttore', 'responsabile'), async (req, res) => {
    try {
        await CantoSettimana.findByIdAndDelete(req.params.id);
        res.json({ message: 'Canto rimosso' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /canti-settimana/coro/:coroId/tipo/:tipo — svuota una sezione intera
router.delete('/coro/:coroId/tipo/:tipo', auth, roles('admin', 'direttore', 'responsabile'), async (req, res) => {
    try {
        const coriIds = req.utente.cori.map(c => c._id.toString());
        if (!coriIds.includes(req.params.coroId)) {
            return res.status(403).json({ message: 'Non puoi gestire questo coro' });
        }
        await CantoSettimana.deleteMany({ coro: req.params.coroId, tipo: req.params.tipo });
        res.json({ message: 'Sezione svuotata' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;