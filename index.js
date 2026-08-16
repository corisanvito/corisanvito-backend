const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'https://TUO_USERNAME.github.io', // sostituisci con il tuo URL GitHub Pages
  credentials: true
}));
app.use(express.json());

// Connessione MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connesso'))
  .catch(err => console.error('❌ Errore MongoDB:', err));

// Routes (le aggiungiamo dopo)
app.use('/auth', require('./src/routes/auth'));
app.use('/users', require('./src/routes/users'));
app.use('/canti', require('./src/routes/canti'));
app.use('/cori', require('./src/routes/cori'));
app.use('/bacheca', require('./src/routes/bacheca'));
app.use('/presenze', require('./src/routes/presenze'));

// Route di test
app.get('/', (req, res) => {
  res.json({ message: '✅ API Cori San Vito attiva' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});