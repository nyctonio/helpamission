const { member, donation } = require("../../../models");
const wheel = require("../../../models/wheel");
const bcrypt = require("bcryptjs");

const dateConvertor = (date) => {
  let d = new Date(date).toLocaleString("en-CA", { timeZone: "Asia/Kolkata" });
  return d.substring(0, 10);
};

// fetching complete member details to generate excel sheet etc

const hashPassword = async (normalPassword) => {
  const salt = await bcrypt.genSalt(10);
  let secPass = await bcrypt.hash(normalPassword, salt);
  return secPass;
};

const homePageDataFetcher = async () => {
  let finalData = {
    memberCount: "",
    offlineDonation: "",
    onlineDonation: "",
    wheelChairRequest: "",
  };

  let members = await member.find({});
  finalData.memberCount = members.length;

  let offlineDonation = {
    count: 0,
    amount: 0,
  };
  let onlineDonation = {
    count: 0,
    amount: 0,
  };

  let donations = await donation.find({});
  for (let i of donations) {
    if (
      i.donationType === "OfflineCashDonation" ||
      i.donationType === "OfflineUpiDonation"
    ) {
      offlineDonation.count++;
      offlineDonation.amount += i.amount;
    } else {
      onlineDonation.count++;
      onlineDonation.amount += i.amount;
    }
  }

  let wheelChairReq = await wheel.find({ isIssued: false, isReturned: false });
  finalData.wheelChairRequest = wheelChairReq.length;

  finalData.offlineDonation = offlineDonation;
  finalData.onlineDonation = onlineDonation;
  // console.log("this is", finalData);
  return finalData;
};

const memberDataFetcher = async () => {
  let finalData = [];

  let membersData = await member.find({});
  for (let i of membersData) {
    let tempObj = {
      memberID: i.memberID,
      name: i.name,
      contact: i.contact,
      email: i.email,
      bloodGroup: i.bloodGroup,
      address: i.address,
      city: i.city,
      refferdBy: i.refferdBy,
      addedMembers: i.addedMembers.length,
      dateAdded: dateConvertor(i.createdAt),
    };
    let ownDonations = 0;
    let otherDonations = 0;
    for (let j of i.ownDonations) {
      let tempDonation = await donation.findOne({ donationID: j });
      ownDonations += tempDonation.amount;
    }
    for (let j of i.otherDonations) {
      let tempDonation = await donation.findOne({ donationID: j });
      otherDonations += tempDonation.amount;
    }
    tempObj.ownDonations = ownDonations;
    tempObj.otherDonations = otherDonations;

    tempObj.addedMemberData = await addedMemberFetcher(i.memberID);
    tempObj.ownDonationData = await ownDonationFetcher(i.memberID);
    tempObj.otherDonationData = await otherDonationFetcher(i.memberID);
    finalData.push(tempObj);
  }
  // console.log("final data is ", finalData);
  return finalData;
};

const addedMemberFetcher = async (memberID) => {
  let data = [];
  let currMember = await member.findOne({ memberID: memberID });
  for (let i of currMember.addedMembers) {
    let tempMember = await member.findOne({ memberID: i });
    let tempObj = {
      memberID: tempMember.memberID,
      name: tempMember.name,
      contact: tempMember.contact,
      address: tempMember.address,
      city: tempMember.city,
      createdAt: tempMember.createdAt,
    };
    data.push(tempObj);
  }
  return data;
};

const ownDonationFetcher = async (memberID) => {
  let data = [];
  let currMember = await member.findOne({ memberID });
  for (let i of currMember.ownDonations) {
    let tempDonation = await donation.findOne({ donationID: i });
    let tempObj = {
      donationID: tempDonation.donationID,
      memberID: tempDonation.donorID,
      paymentMode: "Razorpay",
      payment_id: tempDonation.payment_id,
      amount: tempDonation.amount,
      date: dateConvertor(tempDonation.createdAt),
    };
    data.push(tempObj);
  }
  return data;
};

const otherDonationFetcher = async (memberID) => {
  let data = [];
  let currMember = await member.findOne({ memberID });
  for (let i of currMember.otherDonations) {
    let tempDonation = await donation.findOne({ donationID: i });
    let tempObj = {
      donationID: tempDonation.donationID,
      paymentMode:
        tempDonation.donationType === "offlineUpiDonation" ? "UPI" : "Cash",
      referredBy: tempDonation.donorID,
      amount: tempDonation.amount,
      date: dateConvertor(tempDonation.createdAt),
    };
    data.push(tempObj);
  }
  return data;
};

const transactionDataFetcher = async () => {
  let donationData = await donation.find({});

  let homePageDonations = [];
  let memberDonation = [];
  let offlineDonation = [];

  for (let i of donationData) {
    switch (i.donationType) {
      case "visitorOnlineDonation":
        var tempData = {
          donationID: i.donationID,
          visitorID: i.donorID,
          paymentMode: "Razorpay",
          payment_id: i.payment_id,
          amount: i.amount,
          date: dateConvertor(i.createdAt),
        };
        homePageDonations.push(tempData);
        break;
      case "memberFixedDonation":
        var tempData = {
          donationID: i.donationID,
          memberID: i.donorID,
          paymentMode: "Razorpay",
          payment_id: i.payment_id,
          amount: i.amount,
          date: dateConvertor(i.createdAt),
        };
        memberDonation.push(tempData);
        break;
      case "memberNormalDonation":
        var tempData = {
          donationID: i.donationID,
          memberID: i.donorID,
          paymentMode: "Razorpay",
          payment_id: i.payment_id,
          amount: i.amount,
          date: dateConvertor(i.createdAt),
        };
        memberDonation.push(tempData);
        break;
      case "offlineUpiDonation":
        var tempData = {
          donationID: i.donationID,
          paymentMode: "UPI",
          collectedBy: i.donorID,
          amount: i.amount,
          date: dateConvertor(i.createdAt),
        };
        offlineDonation.push(tempData);
        break;
      case "offlineCashDonation":
        var tempData = {
          donationID: i.donationID,
          paymentMode: "UPI",
          collectedBy: i.donorID,
          amount: i.amount,
          date: dateConvertor(i.createdAt),
        };
        offlineDonation.push(tempData);
        break;
    }
  }
  return {
    homePageDonations,
    memberDonation,
    offlineDonation,
  };
  // console.log("data is ", homePageDonations, memberDonation, offlineDonation);
};

// fixed donation data fetcher
const fixedDonationFetcher = async () => {
  let defaulters = [];
  let normal = [];

  let membersData = await member.find({});
  for (let i of membersData) {
    let tempObj = {
      name: i.name,
      memberID: i.memberID,
      email: i.email,
      contact: i.contact,
      address: i.address,
      nextDueDate: String(Date(parseInt(i.nextDueDate))).slice(0, 15),
    };

    if (i.nextDueDate > Date.now()) {
      //pushing in normal
      normal.push(tempObj);
    } else {
      defaulters.push(tempObj);
    }
  }

  let data = {
    defaulters: defaulters,
    normal: normal,
  };
  return data;
};

// wheel chair data fetcher
const wheelChairDataFetcher = async () => {
  try {
    let currData = await wheel.find({});
    let request = [];
    let approved = [];
    let returned = [];
    for (let i of currData) {
      if (i.isIssued && i.isReturned) {
        let tempObj = {
          _id: i._id,
          name: i.name,
          address: i.address,
          contact: i.contact,
          email: i.email,
          status: "returned",
          dateAdded: dateConvertor(i.createdAt),
        };
        returned.push(tempObj);
      } else if (!i.isIssued && !i.isReturned) {
        let tempObj = {
          _id: i._id,
          name: i.name,
          address: i.address,
          contact: i.contact,
          email: i.email,
          status: "requested",
          dateAdded: dateConvertor(i.createdAt),
        };
        request.push(tempObj);
      } else if (i.isIssued && !i.isReturned) {
        let tempObj = {
          _id: i._id,
          name: i.name,
          address: i.address,
          contact: i.contact,
          email: i.email,
          status: "approved",
          dateAdded: dateConvertor(i.createdAt),
        };
        approved.push(tempObj);
      }
    }
    let mainData = {
      request,
      approved,
      returned,
    };
    console.log(mainData);
    return mainData;
  } catch (err) {
    console.log("error in fetching data", err);
    return res.send({ msg: "some err" });
  }
};

module.exports = {
  memberDataFetcher,
  transactionDataFetcher,
  fixedDonationFetcher,
  wheelChairDataFetcher,
  homePageDataFetcher,
  hashPassword,
};
