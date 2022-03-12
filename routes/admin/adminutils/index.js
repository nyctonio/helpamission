const { member, donation } = require("../../../models");
const wheel = require("../../../models/wheel");

const dateConvertor = (date) => {
    let d = new Date(date).toLocaleString("en-CA", { timeZone: "Asia/Kolkata" });
    return d.substring(0, 10);
};

// fetching complete member details to generate excel sheet etc

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
    console.log("final data is ", finalData);
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
            refferalCode: tempMember,
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
    }
    // console.log("data is ", homePageDonations, memberDonation, offlineDonation);
};

// fixed donation data fetcher
const fixedDonationFetcher = async () => {
    let defaulters = [];
    let normal = [];

    let membersData = await member.find({});
    for (let i of membersData) {
        let tempObj = {
            memberID: i.memberID,
            email: i.email,
            contact: i.contact,
            address: i.address,
            nextDueDate: i.nextDueDate,
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
        let newReq = [];
        let activeReq = [];
        let completedReq = [];
        for (let i of currData) {
            if (i.isIssued && i.isReturned) {
                completedReq.push(i);
            } else if (!i.isIssued && !i.isReturned) {
                newReq.push(i);
            } else if (i.isIssued && !i.isReturned) {
                activeReq.push(i);
            }
        }
        let mainData = {
            newReq: newReq,
            activeReq: activeReq,
            completedReq: completedReq,
        };
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
};
