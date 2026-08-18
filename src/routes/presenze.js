const express = require('express');
const router = express.Router();
const Presenza = require('../models/Presenza');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /presenze/statistiche — DEVE stare prima di /:id
router.get('/statistiche', auth, async (req, res) => {
  try {
    const utenteId = req.utente._id;
    const totale = await Presenza.countDocuments({ utente: utenteId });
    const presenti = await Presenza.countDocuments({ utente: utenteId, presente: true });
    const prove = await Presenza.countDocuments({ utente: utenteId, tipo: 'prova' });
    const celebrazioni = await Presenza.countDocuments({ utente: utenteId, tipo: 'celebrazione' });

    res.json({
      totale,
      presenti,
      assenti: totale - presenti,
      percentuale: totale > 0 ? Math.round((presenti / totale) * 100) : 0,
      prove,
      celebrazioni
    });
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// GET /presenze
router.get('/', auth, async (req, res) => {
  try {
    const isAdmin = ['direttore', 'responsabile'].includes(req.utente.ruolo);
    const query = isAdmin
      ? { coro: { $in: req.utente.cori } }  // vede i suoi cori
      : { utente: req.utente._id };           // vede solo le proprie

    const presenze = await Presenza.find(query)
      .populate('utente', 'nome cognome')
      .populate('coro', 'nome')
      .sort({ data: -1 });

    res.json(presenze);
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// POST /presenze — registra presenza
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
  try {
    const { utente, coro, tipo, data, presente, note } = req.body;

    // Il responsabile può registrare solo per i suoi cori
    const isAdmin = ['direttore', 'responsabile'].includes(req.utente.ruolo);
    if (isAdmin) {
      const coriIds = req.utente.cori.map(c => c._id ? c._id.toString() : c.toString());
      if (!coriIds.includes(coro)) {
        return res.status(403).json({ message: 'Non puoi registrare presenze per questo coro' });
      }
    }

    const presenza = new Presenza({ utente, coro, tipo, data, presente, note, registratoDa: req.utente._id });
    await presenza.save();
    res.status(201).json(presenza);
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// PATCH /presenze/:id
router.patch('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
  try {
    const presenza = await Presenza.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!presenza) return res.status(404).json({ message: 'Presenza non trovata' });
    res.json(presenza);
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// DELETE /presenze/:id
router.delete('/:id', auth, roles('direttore'), async (req, res) => {
  try {
    await Presenza.findByIdAndDelete(req.params.id);
    res.json({ message: 'Presenza eliminata' });
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// GET /presenze/coro/:coroId — presenze di un coro specifico (admin)
router.get('/coro/:coroId', auth, roles('direttore', 'responsabile'), async (req, res) => {
  try {
    // verifica che il coro sia tra i suoi
    const coriIds = req.utente.cori.map(c => c._id.toString());
    if (!coriIds.includes(req.params.coroId)) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const presenze = await Presenza.find({ coro: req.params.coroId })
      .populate('utente', 'nome cognome')
      .populate('coro', 'nome')
      .sort({ data: -1 });

    res.json(presenze);
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;