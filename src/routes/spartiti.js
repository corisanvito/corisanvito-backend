const express = require('express');
const router = express.Router();
const multer = require('multer');
const Spartito = require('../models/Spartito');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { caricaSuDrive, eliminaDaDrive } = require('../utils/drive');

const upload = multer({ storage: multer.memoryStorage() });

// GET /spartiti — lista tutti gli spartiti
router.get('/', auth, async (req, res) => {
    try {
        const spartiti = await Spartito.find()
            .populate('canto', 'titolo')
            .populate('caricatoDa', 'nome cognome')
            .sort({ createdAt: -1 });
        res.json(spartiti);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// GET /spartiti/canto/:cantoId — spartiti di un canto specifico
router.get('/canto/:cantoId', auth, async (req, res) => {
    try {
        const spartiti = await Spartito.find({ canto: req.params.cantoId })
            .populate('canto', 'titolo')
            .populate('caricatoDa', 'nome cognome')
            .sort({ createdAt: -1 });
        res.json(spartiti);
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /spartiti — carica spartito
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        const { canto, tonalita, strumenti } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Nessun file caricato' });

        const risultato = await caricaSuDrive(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        const spartito = new Spartito({
            canto,
            tonalita: tonalita || '',
            strumenti: strumenti ? JSON.parse(strumenti) : [],
            file: {
                nome: req.file.originalname,
                url: risultato.downloadLink,
                driveId: risultato.id,
                mimeType: req.file.mimetype
            },
            caricatoDa: req.utente._id
        });

        await spartito.save();
        res.status(201).json(spartito);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore del server' });
    }
});

// DELETE /spartiti/:id — elimina (solo chi ha caricato o admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const spartito = await Spartito.findById(req.params.id);
        if (!spartito) return res.status(404).json({ message: 'Spartito non trovato' });

        const isAdmin = ['admin', 'direttore', 'responsabile'].includes(req.utente.ruolo);
        const isAutore = spartito.caricatoDa.toString() === req.utente._id.toString();

        if (!isAdmin && !isAutore) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }

        if (spartito.file?.driveId) await eliminaDaDrive(spartito.file.driveId);
        await spartito.deleteOne();
        res.json({ message: 'Spartito eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;