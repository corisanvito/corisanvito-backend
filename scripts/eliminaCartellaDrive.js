require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/drive']
});

async function elimina() {
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId: process.env.GOOGLE_DRIVE_FOLDER_ID });
    console.log('✅ Cartella eliminata!');
}

elimina().catch(err => {
    console.error('❌ Errore:', err.message);
    process.exit(1);
});