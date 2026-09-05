require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Stock = require('../src/models/Stock');

const OUTPUT_PATH = path.join(__dirname, 'stock-backup.json');

/* ─────────────────────────────────────────────
   Esporta tutti gli stock di tutti i cori
   in un file JSON leggibile da restoreStock.js

   ESEGUIRE CON:  node scripts/exportStock.js
   ───────────────────────────────────────────── */

async function esporta() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso');

    const stocks = await Stock.find()
        .populate('canto', 'titolo')
        .populate('coro', 'nome');

    const dati = stocks
        .filter(s => s.canto && s.coro)
        .map(s => ({
            titoloCanto:    s.canto.titolo,
            coroId:         s.coro._id.toString(),
            coroNome:       s.coro.nome,
            stock:          s.stock,
            numeroLibretto: s.numeroLibretto || '',
            note:           s.note || ''
        }));

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dati, null, 2), 'utf-8');

    // Riepilogo per coro
    const perCoro = {};
    dati.forEach(d => {
        if (!perCoro[d.coroNome]) perCoro[d.coroNome] = 0;
        perCoro[d.coroNome]++;
    });
    console.log(`\n💾 Esportati ${dati.length} record totali:`);
    Object.entries(perCoro).forEach(([nome, n]) => console.log(`   ${nome}: ${n} canti`));
    console.log(`\nSalvato in: ${OUTPUT_PATH}`);

    await mongoose.disconnect();
}

esporta().catch(err => { console.error('❌ Errore:', err); process.exit(1); });
