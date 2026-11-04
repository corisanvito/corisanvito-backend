# Backend Cori San Vito

## Descrizione

Backend REST API per [Cori San Vito](https://corisanvito.github.io), un portale web per la gestione di più cori parrocchiali. Espone gli endpoint usati dal frontend statico su GitHub Pages per autenticazione, gestione utenti, presenze, bacheca, canti, spartiti e stock libretti.

## Stack tecnologico

| Componente | Tecnologia |
| --- | --- |
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (cookie `token`) |
| Email | Nodemailer |
| Hosting | Render (free tier) |

## Struttura del progetto

```
corisanvito-backend/
├── index.js    # Entry point: Express app, middleware, avvio server
├── .env    # Variabili d'ambiente (non in repo)
├── .github/
│   └── workflows/
│       └── keep-alive.yml    # GitHub Action per tenere sveglio il servizio Render
└── src/
    ├── middleware/
    │   └── auth.js    # Verifica JWT e popola req.user
    ├── models/    # Modelli Mongoose
    │   ├── User.js
    │   ├── Coro.js
    │   ├── Canto.js
    │   ├── Presenza.js
    │   ├── Bacheca.js
    │   ├── Stock.js
    │   └── ...
    ├── routes/    # Router Express (uno per risorsa)
    │   ├── auth.js
    │   ├── users.js
    │   ├── canti.js
    │   ├── cori.js
    │   ├── presenze.js
    │   ├── bacheca.js
    │   ├── stock.js
    │   └── ...
    └── utils/
        └── mailer.js    # Configurazione Nodemailer
```

## Variabili d'ambiente

Crea un file `.env` nella root (non committare mai questo file).

| Variabile | Descrizione |
| --- | --- |
| `MONGODB_URI` | URI di connessione a MongoDB Atlas |
| `JWT_SECRET` | Chiave segreta per la firma dei token JWT |
| `NODE_ENV` | Ambiente (`production` su Render) |
| `EMAIL_USER` | Indirizzo email mittente per Nodemailer |
| `EMAIL_PASS` | Password o app-password dell'account email |
| `TELEGRAM_TOKEN` | Token del bot Telegram per i promemoria |
| `TELEGRAM_CHAT_ID` | ID della chat/gruppo Telegram destinatario |

Su Render queste variabili si impostano nella sezione **Environment** del servizio.

## Endpoint API

| Prefisso | Descrizione |
| --- | --- |
| `GET /ping` | Health check — usato dal keep-alive |
| `GET /` | Dashboard di stato (uptime, DB) |
| `/auth` | Login, logout, registrazione |
| `/users` | Gestione utenti e ruoli |
| `/cori` | Dati dei cori (configurazione, elenco) |
| `/canti` | Database canti |
| `/canti-settimana` | Canti selezionati per la settimana |
| `/presenze` | Registro presenze per coro |
| `/bacheca` | Bacheca avvisi |
| `/calendario` | Integrazione calendario |
| `/spartiti` | Gestione spartiti |
| `/stock` | Stock libretti per coro |

Tutti gli endpoint (tranne `/auth`) richiedono autenticazione tramite cookie `token` (JWT).

## Deploy e keep-alive

Il backend è hostato su **Render** (free tier). Il piano gratuito mette il servizio in sleep dopo 15 minuti di inattività.

Per tenerlo attivo dalle 7:00 alle 22:00 (ora italiana) è configurata una **GitHub Action** (`.github/workflows/keep-alive.yml`) che fa un ping a `/ping` ogni 14 minuti, solo nelle ore utili.

```yaml
on:
  schedule:
    - cron: '*/14 5-20 * * *'  # 6-21 UTC = 7-22 ora italiana
```

La notte il servizio va normalmente in sleep. Il primo accesso mattutino avrà un cold start di \~30-60 secondi.
