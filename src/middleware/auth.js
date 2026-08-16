const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({ message: 'Token mancante' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const utente = await User.findById(decoded.id).select('-password');

        if (!utente) {
            return res.status(401).json({ message: 'Utente non trovato' });
        }

        if (!utente.attivo) {
            return res.status(403).json({ message: 'Account non ancora attivato' });
        }

        req.utente = utente;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token non valido' });
    }
};