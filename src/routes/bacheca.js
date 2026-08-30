const express = require('express');
const router = express.Router();
const multer = require('multer');
const Avviso = require('../models/Bacheca');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { caricaSuDrive, eliminaDaDrive } = require('../utils/drive');
const { inviaNotificaBacheca } = require('../utils/mailer');

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

        console.log('avvisi trovati:', avvisi.length, JSON.stringify(avvisi.map(a => ({ id: a._id, titolo: a.titolo, coro: a.coro, voci: a.destinatariVoci, utenti: a.destinatariUtenti }))));

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

            const destinatariUtentiParsed = destinatariUtenti ? JSON.parse(destinatariUtenti) : [];
            const destinatariVociParsed = destinatariVoci ? JSON.parse(destinatariVoci) : [];

            const avviso = new Avviso({
                titolo,
                testo,
                coro: coro || null,
                autore: req.utente._id,
                destinatariUtenti: destinatariUtentiParsed,
                destinatariVoci: destinatariVociParsed,
                allegati
            });

            await avviso.save();
            console.log('avviso salvato:', JSON.stringify({ id: avviso._id, titolo: avviso.titolo, coro: avviso.coro, voci: avviso.destinatariVoci, utenti: avviso.destinatariUtenti, allegati: avviso.allegati?.length }));

            // --- Notifica email ---
            try {
                console.log('Inizio blocco email...');
                let utentiDaNotificare = [];

                if (destinatariUtentiParsed.length > 0) {
                    // Avviso per utenti specifici
                    utentiDaNotificare = await User.find(
                        { _id: { $in: destinatariUtentiParsed } },
                        'email'
                    );
                } else if (destinatariVociParsed.length > 0) {
                    // Avviso per voce/strumento, con o senza coro specifico
                    const filtroVoci = { tipoVoce: { $in: destinatariVociParsed } };
                    if (coro) filtroVoci.cori = coro;
                    utentiDaNotificare = await User.find(filtroVoci, 'email');
                } else {
                    // Avviso generale per coro (o per tutti se coro è null)
                    const filtroCoro = coro ? { cori: coro } : {};
                    utentiDaNotificare = await User.find(filtroCoro, 'email');
                }

                const emails = utentiDaNotificare
                    .map(u => u.email)
                    .filter(Boolean);

                console.log(`Destinatari email trovati: ${emails.length} →`, emails);
                await inviaNotificaBacheca(emails, titolo, testo);
                console.log(`Email bacheca inviata a ${emails.length} destinatari per avviso "${titolo}"`);
            } catch (mailErr) {
                // L'avviso è già salvato: logghiamo l'errore ma non lo propaghiamo
                console.error('Errore invio email bacheca:', mailErr);
            }

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