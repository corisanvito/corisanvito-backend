require('dotenv').config();
const mongoose = require('mongoose');
const Canto = require('../src/models/Canto');
const canti = require('./canti.json');

async function importa() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso');

    let importati = 0;
    let saltati = 0;

    for (const c of canti.canti) {
        const esistente = await Canto.findOne({ titolo: c.titolo });
        if (esistente) { saltati++; continue; }

        // Estrai autore dal metadata
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
            autore: autore,
            categoria: (c.categorie || []).join(', '),
            note: c.url || ''  // salviamo l'url originale nelle note per riferimento
        });

        importati++;
        process.stdout.write(`\r${importati} canti importati…`);
    }

    console.log(`\n✅ Fatto! ${importati} importati, ${saltati} già esistenti.`);
    await mongoose.disconnect();
}

importa().catch(err => { console.error(err); process.exit(1); });