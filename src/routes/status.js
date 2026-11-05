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
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #f7f6f3;
      --surface: #ffffff;
      --border: #e4e2dc;
      --text: #1a1a1a;
      --muted: #888;
      --boot: #301934;
      --ping: #2e7d32;
      --ping-light: #e8f5e9;
      --boot-light: #ede7f6;
      --gap: #e53935;
    }

    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 2rem 1rem 4rem;
    }

    header {
      max-width: 860px;
      margin: 0 auto 2.5rem;
      display: flex;
      align-items: baseline;
      gap: 1rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
    }

    header h1 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--boot);
    }

    header a {
      font-size: 0.82rem;
      color: var(--muted);
      text-decoration: none;
    }

    header a:hover { text-decoration: underline; }

    .main { max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.5rem;
    }

    .card h2 {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 1.2rem;
      text-transform: uppercase;
    }

    /* Stat row */
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
    }

    .stat { text-align: center; }
    .stat .value { font-size: 2rem; font-weight: 700; color: var(--boot); line-height: 1; }
    .stat .label { font-size: 0.78rem; color: var(--muted); margin-top: 0.3rem; }

    /* Timeline bar */
    #timeline-wrap {
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    #timeline {
      display: flex;
      height: 36px;
      border-radius: 6px;
      overflow: hidden;
      min-width: 400px;
      gap: 1px;
      background: var(--border);
    }

    .tl-segment {
      flex-shrink: 0;
      height: 100%;
      cursor: default;
      transition: opacity 0.15s;
    }

    .tl-segment:hover { opacity: 0.75; }
    .tl-segment.up { background: var(--ping); }
    .tl-segment.down { background: var(--gap); }

    .tl-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 0.5rem;
      min-width: 400px;
    }

    /* Boot list */
    .boot-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .boot-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.88rem;
      padding: 0.6rem 0.8rem;
      border-radius: 6px;
      background: var(--boot-light);
    }

    .boot-item .time { font-weight: 600; color: var(--boot); min-width: 160px; }
    .boot-item .ago  { color: var(--muted); font-size: 0.78rem; }

    /* Ping chart */
    #ping-chart-wrap { overflow-x: auto; }

    canvas { display: block; width: 100%; }

    .legend {
      display: flex;
      gap: 1.2rem;
      margin-top: 0.8rem;
      font-size: 0.78rem;
      color: var(--muted);
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .legend .dot {
      width: 10px; height: 10px; border-radius: 50%;
      display: inline-block;
    }

    .empty { color: var(--muted); font-size: 0.88rem; padding: 1rem 0; }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #141414;
        --surface: #1e1e1e;
        --border: #2e2e2e;
        --text: #e8e8e8;
        --muted: #888;
        --boot-light: #2a1f30;
        --ping-light: #1a2e1a;
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