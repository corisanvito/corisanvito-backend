module.exports = (...ruoliConsentiti) => {
    return (req, res, next) => {
        if (!ruoliConsentiti.includes(req.utente.ruolo)) {
            return res.status(403).json({
                message: 'Non hai i permessi per questa operazione'
            });
        }
        next();
    };
};