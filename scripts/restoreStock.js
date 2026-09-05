require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Canto = require('../src/models/Canto');
const Stock = require('../src/models/Stock');

const BACKUP_PATH = path.join(__dirname, 'stock-backup.json');

/* ─────────────────────────────────────────────
   Ripristina gli stock da stock-backup.json
   (generato da exportStock.js o da importCanti.js)

   ESEGUIRE CON:  node scripts/restoreStock.js
   ───────────────────────────────────────────── */

async function ripristina() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso');

    if (!fs.existsSync(BACKUP_PATH)) {
        console.error(`❌ File non trovato: ${BACKUP_PATH}`);
        process.exit(1);
    }

    const dati = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));
    console.log(`📂 Caricati ${dati.length} record dal backup\n`);

    let ripristinati = 0, nonTrovati = 0;

    for (const d of dati) {
        const canto = await Canto.findOne({ titolo: d.titoloCanto });
        if (!canto) {
            console.log(`⚠️  Canto non trovato: "${d.titoloCanto}"`);
            nonTrovati++;
            continue;
        }

        await Stock.findOneAndUpdate(
            { canto: canto._id, coro: d.coroId },
            {
                stock:          d.stock,
                numeroLibretto: d.numeroLibretto || '',
                note:           d.note || '',
                updatedAt:      new Date()
            },
            { upsert: true }
        );
        ripristinati++;
        process.stdout.write(`\r  ${ripristinati} stock ripristinati…`);
    }

    console.log(`\n\n✅ Completato: ${ripristinati} ripristinati, ${nonTrovati} non trovati`);
    await mongoose.disconnect();
}

ripristina().catch(err => { console.error('❌ Errore:', err); process.exit(1); });
