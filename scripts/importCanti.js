require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Canto = require('../src/models/Canto');
const Stock = require('../src/models/Stock');
const Coro = require('../src/models/Coro');

const CANTI_JSON = require('C:/Users/ficot/Desktop/github/corisanvito.github.io/canti.json');
const BACKUP_PATH = path.join(__dirname, 'stock-backup.json');

/* ─────────────────────────────────────────────
   ESEGUIRE CON:  node scripts/importCanti.js
   ───────────────────────────────────────────── */

// ── 1. BACKUP STOCK ──────────────────────────────────────────────────────────
async function backupStock() {
    const stocks = await Stock.find()
        .populate('canto', 'titolo')
        .populate('coro', 'nome');

    const dati = stocks
        .filter(s => s.canto) // scarta eventuali riferimenti orfani
        .map(s => ({
            titoloCanto:    s.canto.titolo,
            coroId:         s.coro._id.toString(),
            coroNome:       s.coro?.nome || '',
            stock:          s.stock,
            numeroLibretto: s.numeroLibretto || '',
            note:           s.note || ''
        }));

    fs.writeFileSync(BACKUP_PATH, JSON.stringify(dati, null, 2), 'utf-8');
    console.log(`💾 Backup di ${dati.length} record di stock salvato in stock-backup.json`);
    return dati.length;
}

// ── 2. IMPORT CANTI (upsert per titolo) ──────────────────────────────────────
async function importaCanti() {
    let aggiornati = 0, creati = 0;

    for (const c of CANTI_JSON.canti) {
        let autore = '';
        if (c.metadata) {
            autore = c.metadata['Testo & Musica']
                || c.metadata['Testo &amp; Musica']
                || c.metadata['Musica']
                || c.metadata['Testo']
                || '';
        }

        const dati = {
            testo:    c.testo || '',
            autore,
            categoria: (c.categorie || []).join(', '),
            url:      c.url || ''
        };

        const esistente = await Canto.findOne({ titolo: c.titolo });
        if (esistente) {
            await Canto.findByIdAndUpdate(esistente._id, { $set: dati });
            aggiornati++;
        } else {
            await Canto.create({ titolo: c.titolo, ...dati });
            creati++;
        }

        process.stdout.write(`\r  ${aggiornati + creati} canti processati…`);
    }

    console.log(`\n✅ Canti: ${creati} creati, ${aggiornati} aggiornati`);
    return { creati, aggiornati };
}

// ── 3. RESTORE STOCK ─────────────────────────────────────────────────────────
async function restoreStock() {
    if (!fs.existsSync(BACKUP_PATH)) {
        console.log('⚠️  Nessun backup trovato, salto il restore.');
        return;
    }

    const dati = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));
    let ripristinati = 0, nonTrovati = 0;

    for (const d of dati) {
        const canto = await Canto.findOne({ titolo: d.titoloCanto });
        if (!canto) {
            console.log(`  ⚠️  Canto non trovato dopo import: "${d.titoloCanto}"`);
            nonTrovati++;
            continue;
        }

        await Stock.findOneAndUpdate(
            { canto: canto._id, coro: d.coroId },
            {
                stock:          d.stock,
                numeroLibretto: d.numeroLibretto,
                note:           d.note,
                updatedAt:      new Date()
            },
            { upsert: true }
        );
        ripristinati++;
    }

    console.log(`✅ Stock: ${ripristinati} ripristinati, ${nonTrovati} non trovati`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso\n');

    console.log('── STEP 1: Backup stock ────────────────────────────');
    await backupStock();

    console.log('\n── STEP 2: Import canti (upsert per titolo) ────────');
    await importaCanti();

    console.log('\n── STEP 3: Restore stock ───────────────────────────');
    await restoreStock();

    console.log('\n🎉 Completato!');
    await mongoose.disconnect();
}

main().catch(err => { console.error('❌ Errore:', err); process.exit(1); });
