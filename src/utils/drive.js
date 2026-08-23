const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function caricaSuDrive(buffer, nomeFile, mimeType) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'corisanvito/bacheca',
                resource_type: 'auto',
                public_id: nomeFile.replace(/\.[^/.]+$/, ''),
                use_filename: true,
                unique_filename: true,
                access_mode: 'public'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    id: result.public_id,
                    viewLink: result.secure_url,
                    downloadLink: result.secure_url
                });
            }
        );

        Readable.from(buffer).pipe(stream);
    });
}

async function eliminaDaDrive(fileId) {
    try {
        await cloudinary.uploader.destroy(fileId, { resource_type: 'auto' });
    } catch (err) {
        console.error('Errore eliminazione Cloudinary:', err.message);
    }
}

module.exports = { caricaSuDrive, eliminaDaDrive };