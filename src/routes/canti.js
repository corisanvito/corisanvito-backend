const express = require('express');
const router = express.Router();
const Canto = require('../models/Canto');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const nodemailer = require('nodemailer');

const upload = multer({ storage: multer.memoryStorage() });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// GET /canti
router.get('/', auth, async (req, res) => {
    try {
        const canti = await Canto.find().sort({ titolo: 1 });
        res.json(canti);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// GET /canti/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const canto = await Canto.findById(req.params.id);
        if (!canto) return res.status(404).json({ message: 'Canto non trovato' });
        res.json(canto);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /canti — crea canto e manda email di notifica
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const { titolo, autore, categoria, testo, note } = req.body;
        const canto = new Canto({ titolo, autore, categoria, testo, note });
        await canto.save();

        // Email di notifica
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: 'corisanvito@gmail.com',
                subject: `🎵 Nuovo canto aggiunto: ${titolo}`,
                text: `${req.utente.nome} ${req.utente.cognome} ha aggiunto il canto "${titolo}"${autore ? ' di ' + autore : ''}${categoria ? ' (categoria: ' + categoria + ')' : ''}.\n\nTesto:\n${testo || '(nessun testo inserito)'}`
            });
        } catch (mailErr) {
            console.error('Errore invio email:', mailErr);
            // non blocca la risposta
        }

        res.status(201).json(canto);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /canti/:id
router.patch('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const canto = await Canto.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!canto) return res.status(404).json({ message: 'Canto non trovato' });
        res.json(canto);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /canti/:id
router.delete('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        await Canto.findByIdAndDelete(req.params.id);
        res.json({ message: 'Canto eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /canti/:id/upload — carica PDF e manda email
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const { titolo, autore, categoria, testo, note, url } = req.body;
        const canto = new Canto({ titolo, autore, categoria, testo, note, url });
        await canto.save();

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: 'corisanvito@gmail.com',
                subject: `🎵 Nuovo canto aggiunto: ${titolo}`,
                text: `${req.utente.nome} ${req.utente.cognome} ha aggiunto il canto "${titolo}"${autore ? ' di ' + autore : ''}${categoria ? ' (categoria: ' + categoria + ')' : ''}.\n\nTesto:\n${testo || '(nessun testo inserito)'}`
            });
        } catch (mailErr) {
            console.error('Errore invio email:', mailErr);
        }

        res.status(201).json(canto);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;