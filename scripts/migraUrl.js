require('dotenv').config();
const mongoose = require('mongoose');
const Canto = require('../src/models/Canto');

async function migra() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ connesso');

    const canti = await Canto.find({ note: /^canti\// });
    for (const c of canti) {
        c.url = c.note;
        c.note = '';
        await c.save();
    }

    console.log(`✅ ${canti.length} url migrati`);
    await mongoose.disconnect();
}

migra().catch(err => { console.error(err); process.exit(1); });