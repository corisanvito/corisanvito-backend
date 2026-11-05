const express = require('express');
const router = express.Router();
const UptimeLog = require('../models/UptimeLog');

router.get('/', async (req, res) => {
    try {
        const logs = await UptimeLog.find({})
            .sort({ timestamp: 1 })
            .lean();

        const logsJson = JSON.stringify(logs);

        res.send(`<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cori San Vito — Storico uptime</title>
  <style>
  <style>
  *,
  *::before,
  *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
  }

  :root {
      color-scheme: light;
      --bg: #f5f3f7;
      --surface: #fff;
      --surface-soft: #faf8fc;
      --border: #e9e3ed;
      --text: #29232e;
      --muted: #817887;
      --boot: #48264f;
      --boot-light: #f1eaf4;
      --ping: #25845a;
      --ping-light: #e8f5ee;
      --gap: #dc5555;
      --shadow: 0 8px 28px rgba(48, 25, 52, .055);
      --radius: 18px;
  }

  html {
      scroll-behavior: smooth;
  }

  body {
      min-height: 100vh;
      padding: 42px 24px 64px;
      background:
          radial-gradient(ellipse at 50% -15%, rgba(112, 70, 125, .11), transparent 42%),
          var(--bg);
      color: var(--text);
      font-family: Inter, "Segoe UI", system-ui, -apple-system, sans-serif;
      font-size: 15px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
  }

  /* HEADER */

  header {
      max-width: 1040px;
      margin: 0 auto 30px;
      padding: 0 2px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border-bottom: 1px solid var(--border);
  }

  header h1 {
      color: var(--boot);
      font-size: clamp(1.25rem, 2.5vw, 1.65rem);
      font-weight: 750;
      letter-spacing: -.045em;
      line-height: 1.2;
  }

  header a {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      padding: 9px 14px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface);
      color: var(--boot);
      font-size: .84rem;
      font-weight: 650;
      text-decoration: none;
      transition: background .18s ease, border-color .18s ease, transform .18s ease;
  }

  header a:hover {
      background: var(--boot-light);
      border-color: #d8c8df;
      transform: translateY(-1px);
  }

  /* LAYOUT */

  .main {
      width: 100%;
      max-width: 1040px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
  }

  /* CARD */

  .card {
      min-width: 0;
      padding: clamp(20px, 3vw, 28px);
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      box-shadow: var(--shadow);
      transition: box-shadow .2s ease;
  }

  .card:hover {
      box-shadow: 0 12px 34px rgba(48, 25, 52, .085);
  }

  .card h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
      color: var(--muted);
      font-size: .76rem;
      font-weight: 750;
      letter-spacing: .095em;
      text-transform: uppercase;
  }

  .card h2::before {
      content: "";
      width: 4px;
      height: 16px;
      flex: 0 0 4px;
      border-radius: 5px;
      background: var(--boot);
  }

  /* STATISTICHE */

  .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
  }

  .stat {
      min-width: 0;
      padding: 20px 14px 18px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: linear-gradient(145deg, var(--surface-soft), var(--surface));
      text-align: center;
  }

  .stat .value {
      color: var(--boot);
      font-size: clamp(1.65rem, 4vw, 2.25rem);
      font-weight: 780;
      letter-spacing: -.06em;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
  }

  .stat .label {
      margin-top: 8px;
      color: var(--muted);
      font-size: .78rem;
      font-weight: 550;
      line-height: 1.35;
  }

  /* TIMELINE */

  #timeline-wrap {
      overflow-x: auto;
      padding: 3px 2px 8px;
      scrollbar-color: var(--border) transparent;
      scrollbar-width: thin;
  }

  #timeline {
      display: flex;
      min-width: 400px;
      height: 42px;
      gap: 2px;
      overflow: hidden;
      border-radius: 9px;
      background: var(--border);
  }

  .tl-segment {
      height: 100%;
      flex-shrink: 0;
      cursor: default;
      transition: opacity .16s ease, filter .16s ease;
  }

  .tl-segment:hover {
      opacity: .72;
      filter: saturate(1.2);
  }

  .tl-segment.up {
      background: var(--ping);
  }

  .tl-segment.down {
      background: var(--gap);
  }

  .tl-labels {
      display: flex;
      justify-content: space-between;
      min-width: 400px;
      margin-top: 9px;
      color: var(--muted);
      font-size: .75rem;
      font-weight: 550;
  }

  /* LEGENDA */

  .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      margin-top: 18px;
      color: var(--muted);
      font-size: .8rem;
  }

  .legend span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
  }

  .legend .dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      border-radius: 50%;
  }

  /* GRAFICO PING */

  #ping-chart-wrap {
      width: 100%;
      overflow-x: auto;
      scrollbar-width: thin;
  }

  canvas {
      display: block;
      max-width: 100%;
      border-radius: 10px;
  }

  /* ULTIMI AVVII */

  .boot-list {
      display: flex;
      flex-direction: column;
      gap: 9px;
  }

  .boot-item {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 48px;
      padding: 11px 15px;
      border: 1px solid #e9e0ed;
      border-radius: 11px;
      background: var(--boot-light);
      font-size: .88rem;
      transition: border-color .18s ease, transform .18s ease;
  }

  .boot-item:hover {
      border-color: #d7c4df;
      transform: translateX(2px);
  }

  .boot-item .time {
      min-width: 160px;
      color: var(--boot);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
  }

  .boot-item .ago {
      color: var(--muted);
      font-size: .78rem;
  }

  .empty {
      padding: 18px 0;
      color: var(--muted);
      font-size: .9rem;
  }

  /* TABLET E SMARTPHONE */

  @media (max-width: 700px) {
      body {
          padding: 28px 16px 44px;
      }

      header {
          align-items: flex-start;
          margin-bottom: 22px;
      }

      header h1 {
          max-width: 65%;
      }

      .main {
          gap: 15px;
      }

      .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
      }

      .stat {
          padding: 17px 10px 15px;
      }

      .card h2 {
          margin-bottom: 18px;
      }
  }

  @media (max-width: 420px) {
      body {
          padding: 22px 12px 36px;
      }

      header {
          gap: 10px;
      }

      header h1 {
          font-size: 1.12rem;
      }

      header a {
          padding: 8px 10px;
          font-size: .76rem;
      }

      .card {
          padding: 18px 15px;
          border-radius: 15px;
      }

      .boot-item {
          align-items: flex-start;
          flex-direction: column;
          gap: 2px;
      }

      .boot-item .time {
          min-width: 0;
      }
  }

  /* ACCESSIBILITA' */

  @media (prefers-reduced-motion: reduce) {

      *,
      *::before,
      *::after {
          scroll-behavior: auto !important;
          transition-duration: .01ms !important;
      }
  }

  /* MODALITA' SCURA */

  @media (prefers-color-scheme: dark) {
      :root {
          color-scheme: dark;
          --bg: #151219;
          --surface: #211c25;
          --surface-soft: #29222e;
          --border: #39313e;
          --text: #f0eaf2;
          --muted: #a99eae;
          --boot: #dfc5e8;
          --boot-light: #33273a;
          --ping: #48ad79;
          --ping-light: #1c382a;
          --gap: #e36b6b;
          --shadow: 0 8px 28px rgba(0, 0, 0, .18);
      }

      body {
          background:
              radial-gradient(ellipse at 50% -15%, rgba(140, 91, 155, .16), transparent 42%),
              var(--bg);
      }

      header a {
          background: var(--surface);
      }

      header a:hover {
          background: var(--boot-light);
          border-color: #66516f;
      }

      .stat {
          background: linear-gradient(145deg, var(--surface-soft), var(--surface));
      }

      .boot-item {
          border-color: #493950;
      }
  }
  </style>
</head>
<body>
<header>
  <h1>🎵 Cori San Vito — Storico uptime</h1>
  <a href="/">← Dashboard</a>
</header>

<div class="main">

  <!-- Statistiche -->
  <div class="card">
    <h2>Ultimi 30 giorni</h2>
    <div class="stats">
      <div class="stat">
        <div class="value" id="stat-boots">—</div>
        <div class="label">avvii (cold start)</div>
      </div>
      <div class="stat">
        <div class="value" id="stat-pings">—</div>
        <div class="label">ping ricevuti</div>
      </div>
      <div class="stat">
        <div class="value" id="stat-gaps">—</div>
        <div class="label">interruzioni rilevate</div>
      </div>
      <div class="stat">
        <div class="value" id="stat-last">—</div>
        <div class="label">ultimo ping</div>
      </div>
    </div>
  </div>

  <!-- Timeline -->
  <div class="card">
    <h2>Timeline attività — ultimi 7 giorni</h2>
    <div id="timeline-wrap">
      <div id="timeline"></div>
      <div class="tl-labels">
        <span id="tl-start"></span>
        <span>oggi</span>
      </div>
    </div>
    <div class="legend" style="margin-top:1rem">
      <span><span class="dot" style="background:#2e7d32"></span>attivo</span>
      <span><span class="dot" style="background:#e53935"></span>inattivo / sleep</span>
    </div>
  </div>

  <!-- Ping per ora -->
  <div class="card">
    <h2>Ping per ora — oggi</h2>
    <div id="ping-chart-wrap">
      <canvas id="ping-chart" height="160"></canvas>
    </div>
  </div>

  <!-- Ultimi avvii -->
  <div class="card">
    <h2>Ultimi avvii del server</h2>
    <div id="boot-list" class="boot-list"></div>
  </div>

</div>

<script>
const RAW = ${logsJson};

// ── Utilities ────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60)   return diff + 's fa';
  if (diff < 3600) return Math.floor(diff / 60) + 'm fa';
  if (diff < 86400)return Math.floor(diff / 3600) + 'h fa';
  return Math.floor(diff / 86400) + 'g fa';
}

// ── Statistiche ──────────────────────────────────────────────
const boots = RAW.filter(l => l.type === 'boot');
const pings = RAW.filter(l => l.type === 'ping');

document.getElementById('stat-boots').textContent = boots.length;
document.getElementById('stat-pings').textContent = pings.length;

const lastPing = pings.length ? new Date(pings[pings.length - 1].timestamp) : null;
document.getElementById('stat-last').textContent = lastPing ? timeAgo(lastPing) : '—';

// Conta gap: intervalli tra ping consecutivi > 20 minuti nelle ore 7-22
let gaps = 0;
const sortedPings = [...pings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
for (let i = 1; i < sortedPings.length; i++) {
  const prev = new Date(sortedPings[i - 1].timestamp);
  const curr = new Date(sortedPings[i].timestamp);
  const diffMin = (curr - prev) / 60000;
  const hour = prev.getHours();
  if (diffMin > 20 && hour >= 7 && hour < 22) gaps++;
}
document.getElementById('stat-gaps').textContent = gaps;

// ── Timeline 7 giorni ────────────────────────────────────────
(function buildTimeline() {
  const SLOT_MIN = 30; // ogni slot = 30 minuti
  const DAYS = 7;
  const totalSlots = DAYS * 24 * (60 / SLOT_MIN);

  const now = new Date();
  const startTime = new Date(now - DAYS * 24 * 60 * 60 * 1000);

  // Mappa ping per slot
  const slotSet = new Set();
  sortedPings.forEach(p => {
    const t = new Date(p.timestamp);
    const slotIdx = Math.floor((t - startTime) / (SLOT_MIN * 60000));
    if (slotIdx >= 0 && slotIdx < totalSlots) slotSet.add(slotIdx);
  });

  const tl = document.getElementById('timeline');
  for (let i = 0; i < totalSlots; i++) {
    const seg = document.createElement('div');
    seg.className = 'tl-segment ' + (slotSet.has(i) ? 'up' : 'down');
    seg.style.flexBasis = (100 / totalSlots) + '%';
    const slotDate = new Date(startTime.getTime() + i * SLOT_MIN * 60000);
    seg.title = fmtDate(slotDate) + ' — ' + (slotSet.has(i) ? 'attivo' : 'inattivo');
    tl.appendChild(seg);
  }

  document.getElementById('tl-start').textContent =
    startTime.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
})();

// ── Ping per ora (oggi) ──────────────────────────────────────
(function buildPingChart() {
  const canvas = document.getElementById('ping-chart');
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;

  const W = canvas.parentElement.offsetWidth || 800;
  const H = 160;
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(DPR, DPR);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const counts = Array(24).fill(0);
  pings.forEach(p => {
    const t = new Date(p.timestamp);
    if (t >= todayStart) counts[t.getHours()]++;
  });

  const max = Math.max(...counts, 1);
  const PAD = { top: 16, right: 8, bottom: 28, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW = Math.floor(chartW / 24) - 2;

  // Griglia
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--border').trim() || '#e4e2dc';
  ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1].forEach(r => {
    const y = PAD.top + chartH * (1 - r);
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + chartW, y);
    ctx.stroke();
  });

  // Barre
  counts.forEach((v, h) => {
    const x = PAD.left + h * (chartW / 24) + 1;
    const barH = (v / max) * chartH;
    const y = PAD.top + chartH - barH;
    ctx.fillStyle = '#2e7d32';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Etichette ore
  ctx.fillStyle = '#888';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  [0, 6, 12, 18, 23].forEach(h => {
    const x = PAD.left + h * (chartW / 24) + barW / 2;
    ctx.fillText(h + ':00', x, H - 6);
  });

  // Etichette Y
  ctx.textAlign = 'right';
  [0, max].forEach(v => {
    const y = v === 0
      ? PAD.top + chartH + 4
      : PAD.top + 8;
    ctx.fillText(v, PAD.left - 6, y);
  });
})();

// ── Ultimi avvii ─────────────────────────────────────────────
(function buildBootList() {
  const list = document.getElementById('boot-list');
  const recent = [...boots]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 15);

  if (!recent.length) {
    list.innerHTML = '<p class="empty">Nessun avvio registrato.</p>';
    return;
  }

  recent.forEach(b => {
    const el = document.createElement('div');
    el.className = 'boot-item';
    el.innerHTML = \`
      <span class="time">\${fmtDate(b.timestamp)}</span>
      <span class="ago">\${timeAgo(b.timestamp)}</span>
    \`;
    list.appendChild(el);
  });
})();
</script>
</body>
</html>`);
    } catch (err) {
        console.error('❌ Errore route /status:', err);
        res.status(500).send('Errore nel caricamento dello storico.');
    }
});

module.exports = router;