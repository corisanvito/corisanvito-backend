const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

/**
 * Invia una mail di notifica per un nuovo avviso in bacheca.
 * @param {string[]} emails - Array di indirizzi destinatari
 * @param {string} titolo - Titolo dell'avviso
 * @param {string} testo - Testo dell'avviso (senza allegati)
 */
async function inviaNotificaBacheca(emails, titolo, testo) {
    if (!emails || emails.length === 0) return;

    await transporter.sendMail({
        from: `"Cori San Vito" <${process.env.MAIL_USER}>`,
        bcc: emails,          // BCC per non esporre gli indirizzi tra i destinatari
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
