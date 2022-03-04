const mongoose = require('mongoose');
const shortid = require('shortid');

const memberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    refferalCode: {
        type: String,
        default: shortid.generate(),
        required: true
    },
    refferdBy: {
        type: String,
        default: 'admin'
    },
    name: {
        type: String
    },
    contact: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    bloodGroup: {
        type: String
    },
    memberID: {
        type: String,
        unique: true
    },
    ownDonations: [
        {
            type: String,
        }
    ],
    otherDonations: [
        {
            type: String
        }
    ],
    addedMembers: [
        {
            type: String
        }
    ],
    lastPaid: {
        type: String,
        default: 'nil'
    }
}, { collection: 'membersauth' })

const member = mongoose.model("member", memberSchema);

module.exports = member;
