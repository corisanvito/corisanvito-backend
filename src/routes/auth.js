const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Trova utente
        const utente = await User.findOne({ email }).populate('cori');
        if (!utente) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        // Controlla se account è attivo
        if (!utente.attivo) {
            return res.status(403).json({ message: 'Account non ancora attivato' });
        }

        // Verifica password
        const passwordCorretta = await bcrypt.compare(password, utente.password);
        if (!passwordCorretta) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        // Genera token
        const token = jwt.sign(
            { id: utente._id, ruolo: utente.ruolo },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            utente: {
                id: utente._id,
                nome: utente.nome,
                cognome: utente.cognome,
                email: utente.email,
                ruolo: utente.ruolo,
                coro: utente.coro
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// GET /auth/me — dati utente loggato
router.get('/me', auth, async (req, res) => {
    res.json(req.utente);
});

module.exports = router;