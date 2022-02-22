const mongoose = require('mongoose');
const shortid = require('shortid');

const memberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refferalCode: { type: String, default: shortid.generate(), required: true },
    refferdBy: { type: String, default: 'nil' },
}, { collection: 'membersauth' })

const member = mongoose.model("member", memberSchema);

module.exports = member;
