require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/drive']
});

async function creaCartella() {
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.create({
        requestBody: {
            name: 'Cori San Vito - Bacheca',
            mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id, name, webViewLink'
    });

    console.log('✅ Cartella creata!');
    console.log('ID:', res.data.id);
    console.log('Link:', res.data.webViewLink);

    // Condividi con il tuo account
    await drive.permissions.create({
        fileId: res.data.id,
        requestBody: {
            role: 'writer',
            type: 'user',
            emailAddress: 'corisanvito@gmail.com'
        }
    });

    console.log('✅ Cartella condivisa con corisanvito@gmail.com');
    console.log('\n👉 Copia questo ID e aggiorna GOOGLE_DRIVE_FOLDER_ID:', res.data.id);
}

creaCartella().catch(err => {
    console.error('❌ Errore:', err.message);
    process.exit(1);
});