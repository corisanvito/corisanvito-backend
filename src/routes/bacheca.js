const express = require('express');
const router = express.Router();
const multer = require('multer');
const Avviso = require('../models/Bacheca');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { caricaSuDrive, eliminaDaDrive } = require('../utils/drive');

const upload = multer({ storage: multer.memoryStorage() });

// GET /bacheca
router.get('/', auth, async (req, res) => {
    try {
        let query;
        if (req.utente.ruolo === 'admin') {
            query = {};
        } else {
            const utenteDb = await User.findById(req.utente._id).populate('cori');

            const tipoVoci = utenteDb.tipoVoce
                ? utenteDb.tipoVoce.split(',').map(v => v.trim())
                : [];
            const coriIds = utenteDb.cori.map(c => c._id || c);

            query = {
                $or: [
                    // avvisi generali per il coro o per tutti
                    {
                        $and: [
                            { $or: [{ coro: { $in: coriIds } }, { coro: null }] },
                            { $or: [{ destinatariUtenti: { $size: 0 } }, { destinatariUtenti: { $exists: false } }] },
                            { $or: [{ destinatariVoci: { $size: 0 } }, { destinatariVoci: { $exists: false } }] }
                        ]
                    },
                    // avvisi per utente specifico
                    { destinatariUtenti: req.utente._id },
                    // avvisi per voce (con o senza coro specifico)
                    { destinatariVoci: { $in: tipoVoci } }
                ]
            };
        }

        const avvisi = await Avviso.find(query)
            .populate('autore', 'nome cognome')
            .populate('coro', 'nome')
            .populate('destinatariUtenti', 'nome cognome')
            .sort({ createdAt: -1 });

        res.json(avvisi);
    } catch (err) {
        console.error('Errore bacheca GET:', err);
        res.status(500).json({ message: 'Errore del server' });
    }
});

// POST /bacheca — crea avviso con allegati opzionali
router.post('/', auth, roles('admin', 'direttore', 'responsabile'),
    upload.array('allegati', 5),
    async (req, res) => {
        try {
            const { titolo, testo, coro, destinatariUtenti, destinatariVoci } = req.body;

            const allegati = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const risultato = await caricaSuDrive(
                        file.buffer,
                        file.originalname,
                        file.mimetype
                    );
                    allegati.push({
                        nome: file.originalname,
                        viewLink: risultato.viewLink,
                        downloadLink: risultato.downloadLink,
                        driveId: risultato.id,
                        mimeType: file.mimetype
                    });
                }
            }

            const avviso = new Avviso({
                titolo,
                testo,
                coro: coro || null,
                autore: req.utente._id,
                destinatariUtenti: destinatariUtenti ? JSON.parse(destinatariUtenti) : [],
                destinatariVoci: destinatariVoci ? JSON.parse(destinatariVoci) : [],
                allegati
            });

            await avviso.save();
            res.status(201).json(avviso);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Errore del server' });
        }
    }
);

// DELETE /bacheca/:id
router.delete('/:id', auth, roles('admin', 'direttore', 'responsabile'), async (req, res) => {
    try {
        const avviso = await Avviso.findById(req.params.id);
        if (!avviso) return res.status(404).json({ message: 'Avviso non trovato' });

        for (const a of avviso.allegati || []) {
            if (a.driveId) await eliminaDaDrive(a.driveId);
        }

        await avviso.deleteOne();
        res.json({ message: 'Avviso eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;