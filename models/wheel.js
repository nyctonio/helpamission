const mongoose = require('mongoose');

const wheelSchema = new mongoose.Schema({
    name: { type: String, required: true, },
    email: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String },
    isIssued: { type: Boolean, default: false },
    issueDate: { type: String },
    isReturned: { type: Boolean, default: false },
    returnDate: { type: String },
}, {
    timestamps: true
}, { collection: 'wheel' })

const wheel = mongoose.model("wheel", wheelSchema);

module.exports = wheel;