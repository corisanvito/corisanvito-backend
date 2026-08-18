const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// POST /users — crea utente
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const { nome, cognome, email, password, ruolo, cori, tipoVoce, dataNascita, telefono, note } = req.body;

        const esistente = await User.findOne({ email });
        if (esistente) return res.status(400).json({ message: 'Email già registrata' });

        const hash = await bcrypt.hash(password, 10);
        const utente = new User({
            nome, cognome, email, password: hash, ruolo, cori,
            tipoVoce: tipoVoce || '',
            dataNascita: dataNascita || null,
            telefono: telefono || '',
            note: note || '',
            attivo: false
        });

        await utente.save();
        res.status(201).json({ message: 'Utente creato, in attesa di attivazione' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// GET /users
router.get('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const utenti = await User.find({ cori: { $in: req.utente.cori } })
            .select('-password')
            .populate('cori');
        res.json(utenti);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /users/:id/attiva
router.patch('/:id/attiva', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const utente = await User.findByIdAndUpdate(req.params.id, { attivo: true }, { new: true }).select('-password');
        if (!utente) return res.status(404).json({ message: 'Utente non trovato' });
        res.json({ message: 'Account attivato', utente });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /users/:id/profilo — l'utente modifica il proprio profilo
router.patch('/:id/profilo', auth, async (req, res) => {
    try {
        if (req.utente._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }
        const { email, tipoVoce, dataNascita, telefono, note } = req.body;
        const utente = await User.findByIdAndUpdate(
            req.params.id,
            { email, tipoVoce, dataNascita, telefono, note },
            { new: true }
        ).select('-password').populate('cori');
        res.json(utente);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /users/:id
router.delete('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Utente eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /users/:id/password — cambio password (solo se stessi)
router.patch('/:id/password', auth, async (req, res) => {
    try {
        if (req.utente._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }

        const { passwordAttuale, passwordNuova } = req.body;
        const utente = await User.findById(req.params.id);
        if (!utente) return res.status(404).json({ message: 'Utente non trovato' });

        const corretta = await bcrypt.compare(passwordAttuale, utente.password);
        if (!corretta) return res.status(401).json({ message: 'Password attuale non corretta' });

        utente.password = await bcrypt.hash(passwordNuova, 10);
        await utente.save();

        res.json({ message: 'ok' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;