const mongoose = require('mongoose');

const uptimeLogSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['boot', 'ping'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
        // NON mettere "index: true" qui
    },
    source: {
        type: String,
        default: 'unknown'
    }
});

// TTL: cancella i documenti dopo 30 giorni
uptimeLogSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60, name: 'timestamp_ttl' }
);

module.exports = mongoose.model('UptimeLog', uptimeLogSchema);