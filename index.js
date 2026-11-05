const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const https = require('https');
require('dotenv').config();

const { inviaPromemoria } = require('./src/utils/mailer');
const UptimeLog = require('./src/models/UptimeLog');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://corisanvito.github.io',
  credentials: true
}));
app.use(express.json());

// Connessione MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connesso'))
  .catch(err => console.error('❌ Errore MongoDB:', err));

// Routes
app.use('/auth', require('./src/routes/auth'));
app.use('/users', require('./src/routes/users'));
app.use('/canti', require('./src/routes/canti'));
app.use('/cori', require('./src/routes/cori'));
app.use('/bacheca', require('./src/routes/bacheca'));
app.use('/presenze', require('./src/routes/presenze'));
app.use('/canti-settimana', require('./src/routes/cantiSettimana'));
app.use('/calendario', require('./src/routes/calendario'));
app.use('/spartiti', require('./src/routes/spartiti'));
app.use('/stock', require('./src/routes/stock'));

// Status page
app.use('/status', require('./src/routes/status'));

// Ping — usato da GitHub Actions per tenere sveglio il servizio
app.get('/ping', async (req, res) => {
  try {
    const source = req.headers['x-ping-source'] || 'unknown';
    await UptimeLog.create({ type: 'ping', source });
  } catch (err) {
    console.error('❌ Errore log ping:', err.message);
  }
  res.status(200).send('pong');
});

// Dashboard di stato
app.get('/', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connesso' : 'disconnesso';
  const uptime = process.uptime();
  const ore = Math.floor(uptime / 3600);
  const minuti = Math.floor((uptime % 3600) / 60);
  const secondi = Math.floor(uptime % 60);

  res.send(`<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="30">
  <title>Cori San Vito — API</title>
  <script src="https://cdn.counter.dev/script.js" data-id="0b8a28a7-bd9e-4970-aa87-bd107e273a32" data-utcoffset="2"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1b1b1b;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 2.5rem 3rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 480px;
      width: 90%;
      text-align: center;
    }
    .logo { font-size: 2.5rem; margin-bottom: 0.5rem; }
    h1 { font-size: 1.4rem; color: #301934; margin-bottom: 0.3rem; }
    .subtitle { font-size: 0.88rem; color: #888; margin-bottom: 2rem; }
    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .status-item { background: #f8f8f8; border-radius: 8px; padding: 1rem; }
    .status-label {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.3rem;
    }
    .status-value { font-size: 1rem; font-weight: 600; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.4rem; }
    .dot.green { background: #2e7d32; }
    .dot.red   { background: #c0392b; }
    .ok  { color: #2e7d32; }
    .err { color: #c0392b; }
    .footer { font-size: 0.78rem; color: #aaa; margin-top: 1.5rem; }
    .status-link { display: inline-block; margin-top: 1.2rem; font-size: 0.85rem; color: #301934; text-decoration: none; border-bottom: 1px solid #301934; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🎵</div>
    <h1>Cori San Vito</h1>
    <p class="subtitle">Backend API — Render</p>
    <div class="status-grid">
      <div class="status-item">
        <div class="status-label">API</div>
        <div class="status-value ok"><span class="dot green"></span>Attiva</div>
      </div>
      <div class="status-item">
        <div class="status-label">Database</div>
        <div class="status-value ${dbStatus === 'connesso' ? 'ok' : 'err'}">
          <span class="dot ${dbStatus === 'connesso' ? 'green' : 'red'}"></span>${dbStatus}
        </div>
      </div>
      <div class="status-item">
        <div class="status-label">Uptime</div>
        <div class="status-value">${ore}h ${minuti}m ${secondi}s</div>
      </div>
      <div class="status-item">
        <div class="status-label">Ambiente</div>
        <div class="status-value">${process.env.NODE_ENV || 'production'}</div>
      </div>
    </div>
    <a class="status-link" href="/status">Storico uptime →</a>
    <p class="footer">
      ${new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      — ${new Date().toLocaleTimeString('it-IT')}
    </p>
  </div>
</body>
</html>`);
});

app.get('/version', (req, res) => res.json({ node: process.version }));

// Test promemoria manuale (da rimuovere dopo il collaudo)
app.get('/test-promemoria', async (req, res) => {
  try {
    await inviaPromemoria();
    console.log('✅ Email promemoria inviata');

    const STAMPA_CANTI_MSG = `🎵 Promemoria: ricordati di stampare i canti per domani!\nhttps://corisanvito.github.io/portale/stampa-canti`;
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=${encodeURIComponent(STAMPA_CANTI_MSG)}`;

    await new Promise((resolve, reject) => {
      https.get(url, (r) => {
        console.log('✅ Telegram promemoria inviato, status:', r.statusCode);
        resolve();
      }).on('error', reject);
    });

    res.json({ ok: true, message: 'Email e Telegram inviati con successo' });
  } catch (err) {
    console.error('❌ Errore test promemoria:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  // Logga il boot su MongoDB (con piccolo delay per attendere la connessione)
  setTimeout(async () => {
    try {
      await UptimeLog.create({ type: 'boot', source: 'render' });
      console.log('✅ Boot loggato');
    } catch (err) {
      console.error('❌ Errore log boot:', err.message);
    }
  }, 3000);
});