const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { inviaCredenziali, inviaNotificaAdmin } = require('../utils/mailer');

// Genera una password casuale sicura (10 caratteri: maiusc + minusc + numeri)
function generaPassword() {
    const maiuscole = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const minuscole = 'abcdefghjkmnpqrstuvwxyz';
    const numeri = '23456789';
    const tutti = maiuscole + minuscole + numeri;

    // Garantisce almeno uno per categoria
    const pwd = [
        maiuscole[Math.floor(Math.random() * maiuscole.length)],
        maiuscole[Math.floor(Math.random() * maiuscole.length)],
        minuscole[Math.floor(Math.random() * minuscole.length)],
        minuscole[Math.floor(Math.random() * minuscole.length)],
        numeri[Math.floor(Math.random() * numeri.length)],
        numeri[Math.floor(Math.random() * numeri.length)],
        ...Array.from({ length: 4 }, () => tutti[Math.floor(Math.random() * tutti.length)])
    ];

    // Mescola
    return pwd.sort(() => Math.random() - 0.5).join('');
}

// POST /users — crea utente
router.post('/', auth, roles('admin', 'direttore', 'responsabile'), async (req, res) => {
    try {
        const { nome, cognome, email, ruolo, cori, tipoVoce, dataNascita, telefono, note } = req.body;

        const esistente = await User.findOne({ email });
        if (esistente) return res.status(400).json({ message: 'Email già registrata' });

        const passwordTemporanea = generaPassword();
        const hash = await bcrypt.hash(passwordTemporanea, 10);

        const utente = new User({
            nome, cognome, email, password: hash, ruolo, cori,
            tipoVoce: tipoVoce || '',
            dataNascita: dataNascita || null,
            telefono: telefono || '',
            note: note || '',
            attivo: false,
            primoAccesso: true
        });

        await utente.save();
        res.status(201).json({ message: 'Utente creato, in attesa di attivazione' });

        // Email con credenziali all'utente e notifica all'admin (in background)
        try {
            await inviaCredenziali({ nome, cognome, email, ruolo, passwordTemporanea });
            await inviaNotificaAdmin({ nome, cognome, email, ruolo });
            console.log(`Email credenziali inviata a ${email}`);
        } catch (mailErr) {
            console.error('Errore invio email credenziali:', mailErr);
        }

    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// GET /users
router.get('/', auth, roles('admin', 'direttore', 'responsabile'), async (req, res) => {
    try {
        const query = req.utente.ruolo === 'admin'
            ? {}
            : { cori: { $in: req.utente.cori } };

        const utenti = await User.find(query).select('-password').populate('cori');
        res.json(utenti);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /users/:id/attiva
router.patch('/:id/attiva', auth, roles('admin', 'direttore', 'responsabile'), async (req, res) => {
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

        // Validazione criteri sicurezza
        if (passwordNuova.length < 8) {
            return res.status(400).json({ message: 'La password deve essere di almeno 8 caratteri' });
        }
        if (!/[A-Z]/.test(passwordNuova)) {
            return res.status(400).json({ message: 'La password deve contenere almeno una lettera maiuscola' });
        }
        if (!/[a-z]/.test(passwordNuova)) {
            return res.status(400).json({ message: 'La password deve contenere almeno una lettera minuscola' });
        }
        if (!/[0-9]/.test(passwordNuova)) {
            return res.status(400).json({ message: 'La password deve contenere almeno un numero' });
        }

        utente.password = await bcrypt.hash(passwordNuova, 10);
        utente.primoAccesso = false;
        await utente.save();

        res.json({ message: 'ok' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /users/:id
router.delete('/:id', auth, roles('admin', 'direttore', 'responsabile'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Utente eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;
