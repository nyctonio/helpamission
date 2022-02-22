const mongoose = require('mongoose');
const donationSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    byCash: {
        type: Boolean,
        default: false
    },
    memberID: {
        type: String
    },
    order_id: {
        type: String
    },
    payment_id: {
        type: String
    },
    isRefunded: {
        type: Boolean,
        default: false
    },
    dateAndTime: {
        type: String,
        default: Date.now()
    },
    donationID: {
        type: Number,
        required: true
    }
});

const donation = mongoose.model('donation', donationSchema);
module.exports = donation;