const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mappa coroId → calendar ID Google
const CALENDARI = {
    [process.env.CAL_ID_CORO10]: process.env.CAL_CORO10,
    [process.env.CAL_ID_CORO1115]: process.env.CAL_CORO1115,
    [process.env.CAL_ID_ESTATE]: process.env.CAL_ESTATE,
};

// GET /calendario/:coroId — eventi del coro (solo utenti loggati)
router.get('/:coroId', auth, async (req, res) => {
    try {
        console.log('coroId ricevuto:', req.params.coroId);
        console.log('CALENDARI keys:', Object.keys(CALENDARI));
        console.log('calendarId trovato:', CALENDARI[req.params.coroId]);

        const calendarId = CALENDARI[req.params.coroId];
        if (!calendarId) {
            return res.status(404).json({ message: 'Calendario non trovato' });
        }

        const oggi = new Date();
        const traUnAnno = new Date();
        traUnAnno.setFullYear(oggi.getFullYear() + 1);

        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${process.env.GOOGLE_API_KEY}&timeMin=${oggi.toISOString()}&timeMax=${traUnAnno.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`;

        const risposta = await fetch(url);
        const data = await risposta.json();

        console.log('Google response status:', risposta.status);
        console.log('Google response data:', JSON.stringify(data));

        if (data.error) {
            return res.status(500).json({ message: data.error.message });
        }

        const eventi = (data.items || []).map(e => ({
            id: e.id,
            title: e.summary || '(senza titolo)',
            start: e.start.dateTime || e.start.date,
            end: e.end.dateTime || e.end.date,
            description: e.description || '',
            location: e.location || '',
            allDay: !e.start.dateTime
        }));

        res.json(eventi);
    } catch (err) {
        console.log('Errore catch:', err);
        res.status(500).json({ message: 'Errore del server' });
    }
});

module.exports = router;