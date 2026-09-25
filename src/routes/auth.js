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

        const utente = await User.findOne({ email }).populate('cori');
        if (!utente) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        if (!utente.attivo) {
            return res.status(403).json({ message: 'Account non ancora attivato' });
        }

        const passwordCorretta = await bcrypt.compare(password, utente.password);
        if (!passwordCorretta) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

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
                cori: utente.cori,
                primoAccesso: utente.primoAccesso
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

// POST /auth/forgot-password
const crypto = require('crypto');

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        // Risposta sempre uguale per non rivelare quali email esistono
        const genericResponse = res.json({ message: 'Se l\'email è registrata, riceverai un link per il reset.' });

        if (!user) return genericResponse;

        // Genera token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 ora
        await user.save();

        const resetLink = `https://corisanvito.github.io/reset-password.html?token=${token}`;

        // Email all'utente
        await transporter.sendMail({
            from: '"Cori San Vito" <corisanvito@gmail.com>',
            to: user.email,
            subject: 'Reset della tua password',
            html: `
        <p>Ciao ${user.nome || ''},</p>
        <p>Hai richiesto il reset della password. Clicca il link qui sotto (valido per 1 ora):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Se non hai fatto tu questa richiesta, ignora questa email.</p>
      `,
        });

        // Notifica all'admin
        await transporter.sendMail({
            from: '"Cori San Vito" <corisanvito@gmail.com>',
            to: 'corisanvito@gmail.com',
            subject: '[Admin] Richiesta reset password',
            html: `
        <p>L'utente <strong>${user.nome || ''} ${user.cognome || ''}</strong> 
        (${user.email}) ha richiesto il reset della password.</p>
        <p>Data/ora: ${new Date().toLocaleString('it-IT')}</p>
      `,
        });

        return genericResponse;

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore del server.' });
    }
});

// POST auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }, // token non scaduto
        });

        if (!user) {
            return res.status(400).json({ message: 'Link non valido o scaduto.' });
        }

        // Hash nuova password
        const bcrypt = require('bcryptjs');
        user.password = await bcrypt.hash(password, 10);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        // Notifica all'admin
        await transporter.sendMail({
            from: '"Cori San Vito" <corisanvito@gmail.com>',
            to: 'corisanvito@gmail.com',
            subject: '[Admin] Password reimpostata',
            html: `
          <p>L'utente <strong>${user.nome || ''} ${user.cognome || ''}</strong> 
          (${user.email}) ha reimpostato con successo la propria password.</p>
          <p>Data/ora: ${new Date().toLocaleString('it-IT')}</p>
        `,
        });

        res.json({ message: 'Password aggiornata con successo.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore del server.' });
    }
});

module.exports = router;
