const bcrypt = require("bcryptjs");
const { visitor, donation, member } = require("../../../models");

const hashPassword = async (normalPassword) => {
  const salt = await bcrypt.genSalt(10);
  let secPass = await bcrypt.hash(normalPassword, salt);
  return secPass;
};

const getOwnDetails = async (email) => {
  try {
    let currMember = await member.findOne({ email: email });
    console.log(currMember);
    return currMember;
  } catch (err) {
    return null;
  }
};

const getAddedMember = async (email) => {
  try {
    let currMember = await member.findOne({ email: email });
    let membersData = [];
    for (let i of currMember.addedMembers) {
      let tempMember = await member.findOne({ memberID: i });
      membersData.push(tempMember);
    }
    // console.log('members data is ', membersData);
    return membersData;
  } catch (error) {
    return [];
  }
};

const getOwnDonations = async (email) => {
  try {
    let currMember = await member.findOne({ email: email });
    let donationData = [];
    for (let i of currMember.ownDonations) {
      let tempDonation = await donation.findOne({ donationID: i });
      donationData.push(tempDonation);
    }
    console.log("donation data is ", donationData);
    return donationData;
  } catch (error) {
    return [];
  }
};

const getOtherDonations = async (email) => {
  try {
    let currMember = await member.findOne({ email: email });
    let donationData = [];
    for (let i of currMember.otherDonations) {
      let tempDonation = await donation.findOne({ donationID: i });
      donationData.push(tempDonation);
    }
    console.log("donation data is ", donationData);
    return donationData;
  } catch (error) {
    return [];
  }
};

const getMemberDetails = async (memberID) => {
  try {
    let currMember = await member.findOne({ memberID: memberID });
    return currMember;
  } catch (error) {
    return [];
  }
};

const getVisitorDetails = async (visitorID) => {
  try {
    let visitor = await visitor.findOne({ visitorID: visitorID });
    return visitor;
  } catch (err) {
    return [];
  }
};

const dataForProfileSection = async (email) => {
  try {
    let addedMembers = await getAddedMember(email);
    let ownDonations = await getOwnDonations(email);
    let otherDonations = await getOtherDonations(email);
    let userData = await getOwnDetails(email);
    // console.log('added members', addedMembers);
    let data = {
      member: [],
      owndonation: [],
      otherdonation: [],
      owndata: {
        name: userData.name,
        contact: userData.contact,
        bloodGroup: userData.bloodGroup,
        refferalCode: userData.refferalCode,
        address: userData.address,
        nextDueDate: userData.nextDueDate,
        createdAt: userData.createdAt,
        memberID: userData.memberID,
        image: userData.image,
      },
    };
    const newdate = new Date(parseInt(userData.nextDueDate));
    data.owndata.nextDueDate = `${newdate}`.slice(0, 15);
    data.owndata.createdAt = String(data.owndata.createdAt).slice(0, 15);
    for (let i of addedMembers) {
      let temp = {
        memberID: i.memberID,
        name: i.name,
        contact: i.contact,
        bloodGroup: i.bloodGroup,
        createdAt: String(i.createdAt).slice(0, 15),
      };
      data.member.push(temp);
    }
    for (let i of ownDonations) {
      let temp = {
        name: userData.name,
        donationID: i.donationID,
        amount: i.amount,
        createdAt: String(i.createdAt).slice(0, 15),
        payment_id: i.payment_id,
      };
      temp.createdAt = String(temp.createdAt).slice(0, 15);
      data.owndonation.push(temp);
    }
    for (let i of otherDonations) {
      let visitorwhodonated = await visitor.findOne({
        donationID: i.donationID,
      });
      let temp = {
        name: visitorwhodonated.name,
        contact: visitorwhodonated.contact,
        address: visitorwhodonated.address
          ? visitorwhodonated.address
          : "not given",
        bloodGroup: visitorwhodonated.bloodGroup,
        donationID: i.donationID,
        amount: i.amount,
        createdAt: i.createdAt,
        paymentMode: i.donationType === "offlineCashDonation" ? "Cash" : "Upi",
      };
      temp.createdAt = String(temp.createdAt).slice(0, 15);
      data.otherdonation.push(temp);
    }
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};

module.exports = {
  dataForProfileSection,
  hashPassword,
  getAddedMember,
  getOwnDonations,
  getOwnDetails,
  getOtherDonations,
  getMemberDetails,
  getVisitorDetails,
};
