require('dotenv').config();
const mongoose = require('mongoose');
const Canto = require('../src/models/Canto');
const canti = require('C:/Users/ficot/Desktop/github/corisanvito.github.io/canti.json');

/* ESEGUIRE CON node importCanti.js */

async function importa() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso');

    // Reset totale della collezione prima di reimportare
    const { deletedCount } = await Canto.deleteMany({});
    console.log(`🗑️  Collezione svuotata: ${deletedCount} canti rimossi`);

    let importati = 0;

    for (const c of canti.canti) {
        let autore = '';
        if (c.metadata) {
            autore = c.metadata['Testo & Musica']
                || c.metadata['Testo &amp; Musica']
                || c.metadata['Musica']
                || c.metadata['Testo']
                || '';
        }

        await Canto.create({
            titolo: c.titolo,
            testo: c.testo || '',
            autore,
            categoria: (c.categorie || []).join(', '),
            note: c.url || ''
        });

        importati++;
        process.stdout.write(`\r${importati} canti importati…`);
    }

    console.log(`\n✅ Fatto! ${importati} canti importati (db resettato e ricaricato da zero).`);
    await mongoose.disconnect();
}

importa().catch(err => { console.error(err); process.exit(1); });