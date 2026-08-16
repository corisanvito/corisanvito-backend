const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// POST /users — crea nuovo utente (solo direttore/responsabile)
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const { nome, cognome, email, password, ruolo, cori } = req.body;

        const esistente = await User.findOne({ email });
        if (esistente) {
            return res.status(400).json({ message: 'Email già registrata' });
        }

        const hash = await bcrypt.hash(password, 10);

        const utente = new User({
            nome,
            cognome,
            email,
            password: hash,
            ruolo,
            cori,
            attivo: false // deve essere attivato manualmente
        });

        await utente.save();
        res.status(201).json({ message: 'Utente creato, in attesa di attivazione' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// GET /users — lista utenti (solo direttore/responsabile)
router.get('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const utenti = await User.find().select('-password').populate('cori');
        res.json(utenti);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /users/:id/attiva — attiva account (solo direttore/responsabile)
router.patch('/:id/attiva', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const utente = await User.findByIdAndUpdate(
            req.params.id,
            { attivo: true },
            { new: true }
        ).select('-password');

        if (!utente) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        res.json({ message: 'Account attivato', utente });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /users/:id — modifica utente (solo direttore/responsabile)
router.patch('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const { nome, cognome, email, ruolo, cori } = req.body;

        const utente = await User.findByIdAndUpdate(
            req.params.id,
            { nome, cognome, email, ruolo, cori },
            { new: true }
        ).select('-password');

        if (!utente) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        res.json(utente);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /users/:id — elimina utente (solo direttore)
router.delete('/:id', auth, roles('direttore'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Utente eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;