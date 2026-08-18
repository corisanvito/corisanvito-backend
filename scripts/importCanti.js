require('dotenv').config();
const mongoose = require('mongoose');
const Canto = require('../src/models/Canto');
const canti = require('C:/Users/ficot/Desktop/github/corisanvito.github.io/canti.json');

/* ESEGUIRE CON node importCanti.js */

async function importa() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso');

    let importati = 0;
    let aggiornati = 0;

    for (const c of canti.canti) {
        let autore = '';
        if (c.metadata) {
            autore = c.metadata['Testo & Musica']
                || c.metadata['Testo &amp; Musica']
                || c.metadata['Musica']
                || c.metadata['Testo']
                || '';
        }

        const esistente = await Canto.findOne({ titolo: c.titolo });

        await Canto.findOneAndUpdate(
            { titolo: c.titolo },
            {
                titolo: c.titolo,
                testo: c.testo || '',
                autore,
                categoria: (c.categorie || []).join(', '),
                note: c.url || ''
            },
            { upsert: true }
        );

        if (esistente) {
            aggiornati++;
        } else {
            importati++;
        }

        process.stdout.write(`\r${importati} nuovi, ${aggiornati} aggiornati…`);
    }

    console.log(`\n✅ Fatto! ${importati} nuovi importati, ${aggiornati} aggiornati.`);
    await mongoose.disconnect();
}

importa().catch(err => { console.error(err); process.exit(1); });