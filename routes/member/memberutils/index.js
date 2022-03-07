const bcrypt = require('bcryptjs');
const member = require('../../../models/memberauth');
const donation = require('../../../models/donation');

const hashPassword = async (normalPassword) => {
    const salt = await bcrypt.genSalt(10);
    let secPass = await bcrypt.hash(normalPassword, salt);
    return secPass;
}


const getOwnDetails = async (email) => {
    try {
        let currMember = await member.findOne({ email: email });
        return res.send(currMember);
    } catch (err) {
        return [];
    }
}

const getAddedMember = async (email) => {
    try {
        let currMember = await member.findOne({ email: email });
        let membersData = [];
        for (let i of currMember.addedMembers) {
            let tempMember = await member.findOne({ memberID: i });
            membersData.push(tempMember);
        }
        console.log('members data is ', membersData);
        return membersData;
    } catch (error) {
        return [];
    }
}

const getOwnDonations = async (email) => {
    try {
        let currMember = await member.findOne({ email: email });
        let donationData = [];
        for (let i of currMember.ownDonations) {
            let tempDonation = await donation.findOne({ donationID: i });
            donationData.push(tempDonation);
        }
        console.log('donation data is ', donationData);
        return donationData;
    } catch (error) {
        return [];
    }
}





module.exports = { hashPassword, getAddedMember, getOwnDonations, getOwnDetails };