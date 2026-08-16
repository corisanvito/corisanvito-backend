const express = require('express');
const router = express.Router();
const Presenza = require('../models/Presenza');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /presenze — statistiche proprie (corista/strumentista) o tutte (direttore/responsabile)
router.get('/', auth, async (req, res) => {
  try {
    const query = req.utente.ruolo === 'direttore' || req.utente.ruolo === 'responsabile'
      ? {}
      : { utente: req.utente._id };

    const presenze = await Presenza.find(query)
      .populate('utente', 'nome cognome')
      .populate('coro', 'nome')
      .sort({ data: -1 });

    res.json(presenze);
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// GET /presenze/statistiche — statistiche personali
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

// POST /presenze — registra presenza (solo direttore/responsabile)
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
  try {
    const { utente, coro, tipo, data, presente, note } = req.body;

    const presenza = new Presenza({
      utente,
      coro,
      tipo,
      data,
      presente,
      note,
      registratoDa: req.utente._id
    });

    await presenza.save();
    res.status(201).json(presenza);
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// PATCH /presenze/:id — modifica presenza (solo direttore/responsabile)
router.patch('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
  try {
    const presenza = await Presenza.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!presenza) return res.status(404).json({ message: 'Presenza non trovata' });
    res.json(presenza);
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// DELETE /presenze/:id — elimina presenza (solo direttore)
router.delete('/:id', auth, roles('direttore'), async (req, res) => {
  try {
    await Presenza.findByIdAndDelete(req.params.id);
    res.json({ message: 'Presenza eliminata' });
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;