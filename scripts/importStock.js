require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Canto = require('../src/models/Canto');
const Stock = require('../src/models/Stock');

const CORO_ID = '6a8222a329c53cf968d80891'; // ID MongoDB coro delle 10
const CSV_PATH = path.join(__dirname, 'canti.csv');

async function importa() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso');

    const contenuto = fs.readFileSync(CSV_PATH, 'utf-8');
    const righe = contenuto.split('\n').slice(1).filter(r => r.trim());

    let importati = 0, saltati = 0;

    for (const riga of righe) {
        const [title, , , stockStr] = riga.split(';');
        const titolo = title?.trim();
        const stock = parseInt(stockStr?.trim()) || 0;

        if (!titolo || stock === 0) { saltati++; continue; }

        const canto = await Canto.findOne({
            titolo: { $regex: new RegExp(`^${titolo}$`, 'i') }
        });

        if (!canto) {
            console.log(`⚠️  Canto non trovato: "${titolo}"`);
            saltati++;
            continue;
        }

        await Stock.findOneAndUpdate(
            { canto: canto._id, coro: CORO_ID },
            { stock, updatedAt: new Date() },
            { upsert: true }
        );

        console.log(`✅ ${titolo}: stock ${stock}`);
        importati++;
    }

    console.log(`\nFatto! ${importati} importati, ${saltati} saltati.`);
    await mongoose.disconnect();
}

importa().catch(err => { console.error(err); process.exit(1); });