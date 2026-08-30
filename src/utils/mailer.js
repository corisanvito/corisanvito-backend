const { google } = require('googleapis');

async function creaGmailClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
}

function costruisciEmail({ to, bcc, subject, text, html }) {
    const boundary = 'boundary_csv_' + Date.now();
    const lines = [
        `From: "Cori San Vito" <${process.env.MAIL_USER}>`,
        to ? `To: ${to}` : `To: ${process.env.MAIL_USER}`,
        bcc && bcc.length ? `Bcc: ${bcc.join(', ')}` : '',
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        text,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        html,
        '',
        `--${boundary}--`
    ].filter(l => l !== null);

    const raw = lines.join('\r\n');
    return Buffer.from(raw).toString('base64url');
}

/**
 * Invia una mail di notifica per un nuovo avviso in bacheca.
 * @param {string[]} emails - Array di indirizzi destinatari
 * @param {string} titolo - Titolo dell'avviso
 * @param {string} testo - Testo dell'avviso (senza allegati)
 */
async function inviaNotificaBacheca(emails, titolo, testo) {
    if (!emails || emails.length === 0) return;

    const gmail = await creaGmailClient();

    const raw = costruisciEmail({
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
            `<a href="https://corisanvito.github.io/portale/bacheca" ` +
            `style="background:#301934;color:#fff;padding:10px 20px;border-radius:6px;` +
            `text-decoration:none;font-family:sans-serif">Apri la bacheca →</a></p>`
    });

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
    });
}

module.exports = { inviaNotificaBacheca };