const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

async function creaTransporter() {
    const oauth2Client = new OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const { token: accessToken } = await oauth2Client.getAccessToken();

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken
        }
    });
}

/**
 * Invia una mail di notifica per un nuovo avviso in bacheca.
 * @param {string[]} emails - Array di indirizzi destinatari
 * @param {string} titolo - Titolo dell'avviso
 * @param {string} testo - Testo dell'avviso (senza allegati)
 */
async function inviaNotificaBacheca(emails, titolo, testo) {
    if (!emails || emails.length === 0) return;

    const transporter = await creaTransporter();

    await transporter.sendMail({
        from: `"Cori San Vito" <${process.env.MAIL_USER}>`,
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
}

module.exports = { inviaNotificaBacheca };
