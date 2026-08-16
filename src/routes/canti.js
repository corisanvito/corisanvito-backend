const express = require('express');
const router = express.Router();
const Canto = require('../models/Canto');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const nodemailer = require('nodemailer');

const upload = multer({ storage: multer.memoryStorage() });

// Configurazione email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// GET /canti — lista canti
router.get('/', auth, async (req, res) => {
    try {
        const canti = await Canto.find().populate('cori', 'nome');
        res.json(canti);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// GET /canti/:id — singolo canto
router.get('/:id', auth, async (req, res) => {
    try {
        const canto = await Canto.findById(req.params.id).populate('cori', 'nome');
        if (!canto) return res.status(404).json({ message: 'Canto non trovato' });
        res.json(canto);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /canti — crea canto (solo direttore/responsabile)
router.post('/', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const { titolo, autore, categoria, testo, accordi, cori, note } = req.body;
        const canto = new Canto({ titolo, autore, categoria, testo, accordi, cori, note });
        await canto.save();
        res.status(201).json(canto);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// PATCH /canti/:id — modifica canto (solo direttore/responsabile)
router.patch('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        const canto = await Canto.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!canto) return res.status(404).json({ message: 'Canto non trovato' });
        res.json(canto);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /canti/:id — elimina canto (solo direttore/responsabile)
router.delete('/:id', auth, roles('direttore', 'responsabile'), async (req, res) => {
    try {
        await Canto.findByIdAndDelete(req.params.id);
        res.json({ message: 'Canto eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /canti/:id/upload — carica PDF e manda email per revisione
router.post('/:id/upload', auth, roles('direttore', 'responsabile'), upload.single('file'), async (req, res) => {
    try {
        const canto = await Canto.findById(req.params.id);
        if (!canto) return res.status(404).json({ message: 'Canto non trovato' });

        if (!req.file) return res.status(400).json({ message: 'Nessun file caricato' });

        // Manda email con il PDF allegato per revisione
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `📄 Nuova partitura da revisionare: ${canto.titolo}`,
            text: `È stata caricata una nuova partitura per il canto "${canto.titolo}" da ${req.utente.nome} ${req.utente.cognome}. Controlla l'allegato.`,
            attachments: [{
                filename: req.file.originalname,
                content: req.file.buffer
            }]
        });

        res.json({ message: 'File caricato e inviato per revisione via email' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;