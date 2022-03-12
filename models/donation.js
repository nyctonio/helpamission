const mongoose = require('mongoose');
const donationSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    donorID: {
        type: String
    },
    order_id: {
        type: String
    },
    payment_id: {
        type: String
    },
    dateAndTime: {
        type: String,
        default: Date.now()
    },
    donationID: {
        type: Number,
        required: true
    },
    donationType: {
        type: String,
        required: true,
        default: 'visitorOnlineDonation'
    },
}, {
    timestamps: true
});

const donation = mongoose.model('donation', donationSchema);
module.exports = donation;