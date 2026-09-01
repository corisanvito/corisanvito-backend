const { google } = require('googleapis');

async function creaGmailClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    return google.gmail({ version: 'v1', auth: oauth2Client });
}

function costruisciEmail({ to, bcc, subject, text, html }) {
    const boundary = 'boundary_csv_' + Date.now();
    // Codifica Subject in Base64 per supportare caratteri non-ASCII
    const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject).toString('base64') + '?=';
    const headers = [
        `From: "Cori San Vito" <${process.env.MAIL_USER}>`,
        `To: ${to || process.env.MAIL_USER}`,
        ...(bcc && bcc.length ? [`Bcc: ${bcc.join(', ')}`] : []),
        `Subject: ${subjectEncoded}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    const body = [
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        text,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        html,
        '',
        `--${boundary}--`,
    ];
    return Buffer.from([...headers, ...body].join('\r\n')).toString('base64url');
}

async function invia({ to, bcc, subject, text, html }) {
    const gmail = await creaGmailClient();
    const raw = costruisciEmail({ to, bcc, subject, text, html });
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
}

/**
 * Invia le credenziali di accesso al nuovo utente.
 */
async function inviaCredenziali({ nome, cognome, email, ruolo, passwordTemporanea }) {
    const ruoliLabel = {
        corista: 'Corista',
        strumentista: 'Strumentista',
        responsabile: 'Responsabile',
        direttore: 'Direttore',
        admin: 'Admin'
    };

    await invia({
        to: email,
        subject: 'Benvenuto nel portale Cori San Vito — le tue credenziali',
        text:
            `Ciao ${nome},\n\n` +
            `il tuo account per il portale Cori San Vito è stato creato.\n\n` +
            `Email: ${email}\n` +
            `Password temporanea: ${passwordTemporanea}\n` +
            `Ruolo: ${ruoliLabel[ruolo] || ruolo}\n\n` +
            `Al primo accesso ti verrà chiesto di cambiare la password.\n\n` +
            `Accedi qui: https://corisanvito.github.io/portale\n\n` +
            `— Cori San Vito`,
        html:
            `<p>Ciao <strong>${nome}</strong>,</p>` +
            `<p>il tuo account per il portale Cori San Vito è stato creato.</p>` +
            `<table style="font-family:sans-serif;border-collapse:collapse;margin:1rem 0">` +
            `<tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><strong>${email}</strong></td></tr>` +
            `<tr><td style="padding:4px 12px 4px 0;color:#666">Password temporanea</td><td><strong>${passwordTemporanea}</strong></td></tr>` +
            `<tr><td style="padding:4px 12px 4px 0;color:#666">Ruolo</td><td><strong>${ruoliLabel[ruolo] || ruolo}</strong></td></tr>` +
            `</table>` +
            `<p>Al primo accesso ti verrà chiesto di scegliere una nuova password.</p>` +
            `<p style="margin-top:1.5rem">` +
            `<a href="https://corisanvito.github.io/portale" ` +
            `style="background:#301934;color:#ffffff !important;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:sans-serif;display:inline-block">` +
            `Accedi al portale →</a></p>` +
            `<p style="margin-top:2rem;color:#888;font-size:0.85rem">— Cori San Vito</p>`
    });
}

/**
 * Notifica l'admin della creazione di un nuovo account.
 */
async function inviaNotificaAdmin({ nome, cognome, email, ruolo }) {
    const ruoliLabel = {
        corista: 'Corista',
        strumentista: 'Strumentista',
        responsabile: 'Responsabile',
        direttore: 'Direttore',
        admin: 'Admin'
    };

    await invia({
        to: process.env.MAIL_USER,
        subject: `Nuovo account creato: ${nome} ${cognome}`,
        text:
            `È stato creato un nuovo account sul portale Cori San Vito.\n\n` +
            `Nome: ${nome} ${cognome}\n` +
            `Email: ${email}\n` +
            `Ruolo: ${ruoliLabel[ruolo] || ruolo}\n\n` +
            `L'account è in attesa di attivazione.\n\n` +
            `Gestisci gli utenti: https://corisanvito.github.io/portale/utenti`,
        html:
            `<p>È stato creato un nuovo account sul portale Cori San Vito.</p>` +
            `<table style="font-family:sans-serif;border-collapse:collapse;margin:1rem 0">` +
            `<tr><td style="padding:4px 12px 4px 0;color:#666">Nome</td><td><strong>${nome} ${cognome}</strong></td></tr>` +
            `<tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><strong>${email}</strong></td></tr>` +
            `<tr><td style="padding:4px 12px 4px 0;color:#666">Ruolo</td><td><strong>${ruoliLabel[ruolo] || ruolo}</strong></td></tr>` +
            `</table>` +
            `<p>L'account è in attesa di attivazione.</p>` +
            `<p style="margin-top:1.5rem">` +
            `<a href="https://corisanvito.github.io/portale/utenti" ` +
            `style="background:#301934;color:#ffffff !important;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:sans-serif;display:inline-block">` +
            `Gestisci utenti →</a></p>`
    });
}

/**
 * Invia una mail di notifica per un nuovo avviso in bacheca.
 */
async function inviaNotificaBacheca(emails, titolo, testo) {
    if (!emails || emails.length === 0) return;

    await invia({
        bcc: emails,
        subject: `Nuovo avviso in bacheca: ${titolo}`,
        text:
            `Hai un nuovo avviso in bacheca.\n\n` +
            `${titolo}\n\n` +
            `${testo}\n\n` +
            `Apri la bacheca: https://corisanvito.github.io/portale/bacheca`,
        html:
            `<p>Hai un nuovo avviso in bacheca.</p>` +
            `<h2 style="font-family:sans-serif;color:#301934">${titolo}</h2>` +
            `<p style="font-family:sans-serif;white-space:pre-line">${testo}</p>` +
            `<p style="margin-top:1.5rem">` +
            '<a href="https://corisanvito.github.io/portale/bacheca"' +
            ' style="background:#301934;color:#fff;padding:10px 20px;' +
            'border-radius:6px;text-decoration:none;font-family:sans-serif">' +
            'Apri la bacheca \u2192</a></p>'
    });
}

module.exports = { inviaCredenziali, inviaNotificaAdmin, inviaNotificaBacheca };