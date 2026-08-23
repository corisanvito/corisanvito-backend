const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function caricaSuDrive(buffer, nomeFile, mimeType) {
    // Determina il resource_type corretto
    let resourceType = 'raw';
    if (mimeType.startsWith('image/')) resourceType = 'image';
    else if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) resourceType = 'video';

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                upload_preset: 'corisanvito_bacheca',
                folder: 'corisanvito/bacheca',
                resource_type: resourceType,
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
        // Prova prima come raw, poi come image
        try {
            await cloudinary.uploader.destroy(fileId, { resource_type: 'raw' });
        } catch {
            await cloudinary.uploader.destroy(fileId, { resource_type: 'image' });
        }
    } catch (err) {
        console.error('Errore eliminazione Cloudinary:', err.message);
    }
}

module.exports = { caricaSuDrive, eliminaDaDrive };