const mongoose = require('mongoose');

const uptimeLogSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['boot', 'ping'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    source: {
        type: String, // es. 'github-actions', 'manual', 'unknown'
        default: 'unknown'
    }
});

// TTL index: cancella automaticamente i documenti dopo 30 giorni
uptimeLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('UptimeLog', uptimeLogSchema);