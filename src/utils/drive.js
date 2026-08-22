const { google } = require('googleapis');
const { Readable } = require('stream');

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function caricaSuDrive(buffer, nomeFile, mimeType) {
    const stream = Readable.from(buffer);

    const res = await drive.files.create({
        requestBody: {
            name: nomeFile,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
        },
        media: {
            mimeType,
            body: stream
        },
        fields: 'id, webViewLink, webContentLink'
    });

    // Rendi il file pubblico in lettura
    await drive.permissions.create({
        fileId: res.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    return {
        id: res.data.id,
        viewLink: res.data.webViewLink,
        downloadLink: `https://drive.google.com/uc?export=download&id=${res.data.id}`
    };
}

async function eliminaDaDrive(fileId) {
    try {
        await drive.files.delete({ fileId });
    } catch (err) {
        console.error('Errore eliminazione Drive:', err.message);
    }
}

module.exports = { caricaSuDrive, eliminaDaDrive };