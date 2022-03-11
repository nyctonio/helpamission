const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
    hashPassword,
    getAddedMember,
    getOwnDonations,
    getOtherDonations,
    getOwnDetails,
    getVisitorDetails,
    getMemberDetails,
    dataForProfileSection,
} = require("./memberutils");
const {
    verifyMemberToken,
    verifyMemberLogin,
} = require("../../utils/memberauthprovider");
const {
    scheduleforEveryDay,
    scheduleforEveryYear,
} = require("../../utils/sheduler");

const { donation, member, visitor } = require("../../models");
const path = require("path");
const shortid = require("shortid");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const {
    offlineDonationPDF,
    memberDonationPDF,
    memberRegisterationMailer,
} = require("../../mailers/mailer");
const JWT_SECRET = process.env.jwt;
require("dotenv").config();
const key_id = process.env.key_id;
const key_secret = process.env.key_secret;
const razorpay = new Razorpay({
    key_id,
    key_secret,
});

router.get("/", async (req, res) => {
    const { token } = req.cookies;
    if (verifyMemberToken(token)) {
        const verify = jwt.verify(token, JWT_SECRET);
        let addedMembers = await getAddedMember(verify.username);
        let ownDonations = await getOwnDonations(verify.username);
        let otherDonations = await getOtherDonations(verify.username);
        let userData = await getOwnDetails(verify.username);
        delete userData.password;
        let sumOwnDonations = 0;
        if (ownDonations.length > 0) {
            for (let i of ownDonations) {
                sumOwnDonations += i?.amount;
            }
        }
        let sumOtherDonations = 0;
        if (otherDonations.length > 0) {
            for (let i of otherDonations) {
                sumOtherDonations += i?.amount;
            }
        }
        let paidStatus = false;
        if (userData.nextDueDate > Date.now()) {
            paidStatus = true;
        }
        console.log(`Number of added members are ${addedMembers.length}. 
        Own donations are ${sumOwnDonations}. 
        Other Donations are ${sumOtherDonations}. Donation for this cycle is ${paidStatus}`);
        res.render("member", {
            memberdata: {
                addedMembers: addedMembers.length,
                ownDonations: sumOwnDonations,
                otherDonations: sumOtherDonations,
                paidStatus,
            },
        });
    } else {
        res.redirect("/member/login");
    }
});

router.get("/login", (req, res) => {
    res.render("memberlogin");
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const { status, data } = await verifyMemberLogin(email, password);
    if (status === "ok") {
        res.cookie("token", data);
        res.redirect("/member");
    } else {
        res.redirect("/member/login");
    }
});

router.post("/logout", async (req, res) => {
    res.clearCookie("token");
    res.redirect("/member/login");
});

router.get("/addmember", (req, res) => {
    const { token } = req.cookies;
    if (verifyMemberToken(token)) {
        res.render("member/addmembers");
    } else {
        res.redirect("/member/login");
    }
});

router.get("/offline-donation", (req, res) => {
    const { token } = req.cookies;
    if (verifyMemberToken(token)) {
        res.render("member/offlinedonation");
    } else {
        res.redirect("/member/login");
    }
});

router.post("/addmember", async (req, res) => {
    try {
        const info = { ...req.body, password: "", refferdBy: "", memberID: "" };
        let normalPassword = `${req.body.city}${Math.floor(
            1000 + Math.random() * 9000
        )}`;
        console.log(normalPassword);
        info.password = await hashPassword(normalPassword);
        info.memberID = "HAM" + Math.floor(1000 + Math.random() * 9000);
        const { token } = req.cookies;
        const verify = jwt.verify(token, JWT_SECRET);
        // find the member who referred this member
        let currMemberData = await member.findOne({ email: verify.username });
        info.refferdBy = currMemberData.refferalCode;
        // creating new member
        let newmem = await member.create({ ...info }, async (err, newMember) => {
            if (err) {
                throw err;
            } else {
                // sending mail to the new member
                memberRegisterationMailer({ ...info, normalPassword });
                // console.log('new', newMember);
                scheduleforEveryDay(newMember.email);
                scheduleforEveryYear(newMember.email);
                currMemberData.addedMembers.push(info.memberID);
                await currMemberData.save();
            }
        });
        console.log(newmem);
        res.json({ status: "ok" });
    } catch (error) {
        console.log(error);
        return res.json({ error });
    }
});

// rendering profile section
router.get("/profile-section", async (req, res) => {
    try {
        const { token } = req.cookies;
        const verify = jwt.verify(token, JWT_SECRET);

        const profiledata = await dataForProfileSection(verify.username);
        return res.render("member/profilesection", { profiledata });
    } catch (err) {
        console.log(err);
        return res.json({ err });
    }
});

// file downloader
router.get("/download-slip/:donationID", async (req, res, next) => {
    try {
        let donationDetails = await donation.findOne({
            donationID: req.params.donationID,
        });
        switch (donationDetails.donationType) {
            case "visitorOnlineDonation":
                let visitorDetails = await getVisitorDetails(donationDetails.visitorID);
                await visitorOnlineDonationPDF(donationDetails, visitorDetails);
                break;
            case "memberFixedDonation":
                let memberDetails = await getMemberDetails(donationDetails.memberID);
                await memberFixedDonationPDF(donationDetails, memberDetails);
                break;
            case "memberNormalDonation":
                memberDetails = await getMemberDetails(donationDetails.memberID);
                await memberNormalDonationPDF(donationDetails, memberDetails);
                break;
            case "offlineUpiDonation":
                visitorDetails = await getVisitorDetails(donationDetails.visitorID);
                await offlineUpiDonationPDF(donationDetails, visitorDetails);
                break;
            case "offlineCashDonation":
                visitorDetails = await getVisitorDetails(donationDetails.visitorID);
                await offlineCashDonationPDF(donationDetails, visitorDetails);
                break;
        }
        let file = path.join(
            __dirname,
            `../../public/pdf/${donationDetails.donationID}.pdf`
        );
        console.log("file is ", file);
        if (file !== "/") {
            res.download(file, async function (err) {
                if (err) {
                    console.log("error in downloading", err);
                } else {
                    console.log("successfully downloaded the file");
                }
                setTimeout(() => {
                    fileRemover(file);
                }, 5000);
            });
        } else {
            next();
        }
    } catch (err) {
        console.log("error in downloading the slip", err);
        return res.json({ err });
    }
});

// offline donation
router.post("/offine-donation", async (req, res) => {
    try {
        const { token } = req.cookies;
        const verify = jwt.verify(token, JWT_SECRET);
        let currMember = await member.findOne({ email: verify.username });
        // checking for visitor
        const {
            vname,
            vbgroup,
            vmno,
            vemail,
            vdonationamount,
            vaddress,
            vpaymentmode,
        } = req.body;
        // checking for visitor
        let visitorData = await visitor.findOne({ contact: vmno });
        if (!visitorData) {
            visitorData = await visitor.create({
                name: vname,
                bloodGroup: vbgroup,
                contact: vmno,
                email: vemail,
                address: vaddress,
            });
            console.log("visitor successfully created ", visitorData);
        } else {
            console.log("visitor already exists");
            visitorData.name = vname;
            visitorData.bloodGroup = vbgroup;
            visitorData.contact = vmno;
            visitorData.email = vemail;
            visitorData.address = vaddress;
            await visitorData.save();
        }
        let donationData;
        const donationType =
            vpaymentmode === "UPI" ? "offlineUpiDonation" : "offlineCashDonation";
        donationData = await donation.create({
            donationID: Date.now(),
            donorID: currMember.memberID,
            amount: vdonationamount,
            donationType,
        });
        await offlineDonationPDF(donationData, visitorData, true);
        console.log("donation successfully created ", donationData);
        // updating member donation
        currMember.otherDonations.push(donationData.donationID);
        await currMember.save();
        // updaing visitor donations
        visitorData.donations.push(donationData.donationID);
        await visitorData.save();
        return res.json({
            status: "success",
            message: "go back to previous page",
            donationData,
            currMember,
            visitorData,
        });
    } catch (err) {
        console.log("error in creating donation for member ", err);
    }
});

// normal razorpay donation

// normal member donation
router.post("/normal-member-donation", async (req, res) => {
    const options = {
        amount: req.body.amount * 100, //todo add fixed amount
        currency: "INR",
        receipt: shortid.generate(),
        payment_capture: 1,
    };
    razorpay.orders.create(options, function (err, order) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            // console.log(order);
            res.send({ order, amount: req.body.amount });
        }
    });
});

// verification of normal donation
router.post("/normal-member-donation/verify", async (req, res) => {
    const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    const { data } = req.body;
    console.log(req.body);
    let expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");
    console.log("sig" + req.body.razorpay_signature);
    console.log("sig" + expectedSignature);
    let response = { status: "failure" };
    if (expectedSignature === req.body.razorpay_signature) {
        response = { status: "success" };
    }
    if (response.status == "success") {
        const { token } = req.cookies;
        const verify = jwt.verify(token, JWT_SECRET);
        let currMember = await member.findOne({ email: verify.username });
        // adding the donation in member schema
        donation.create({
            amount: data.amount,
            order_id: req.body.razorpay_order_id,
            payment_id: req.body.razorpay_payment_id,
            donationID: Date.now(),
            donorID: currMember.memberID,
            donationType: "memberNormalDonation",
        }).then(async (donateData) => {
            // console.log("donation data is ", donateData, currMember);
            currMember.ownDonations.push(donateData.donationID);
            await currMember.save();
            // sending mail for pdf reciept
            memberDonationPDF(donateData, currMember, true);
        }).catch((err) => {
            console.log("error in adding new donation ", err);
        });
    }
    console.log(response);
    res.send(response);
});

// fixed amount donation

router.post("/fixed-member-donation", async (req, res) => {
    const fixedamount = 1100;
    const options = {
        amount: fixedamount * 100, //todo add fixed amount
        currency: "INR",
        receipt: shortid.generate(),
        payment_capture: 1,
    };
    razorpay.orders.create(options, function (err, order) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            console.log(order);
            res.send({ order, fixedamount });
        }
    });
});

// verifying the fixed member donation and setting dues as paid

router.post("/fixed-member-donation/verify", async (req, res) => {
    try {
        const body =
            req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
        const { data } = req.body;
        console.log(req.body);
        let expectedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(body.toString())
            .digest("hex");
        console.log("sig" + req.body.razorpay_signature);
        console.log("sig" + expectedSignature);
        let response = { status: "failure" };
        if (expectedSignature === req.body.razorpay_signature) {
            response = { status: "success" };
        }
        if (response.status == "success") {
            const { token } = req.cookies;
            const verify = jwt.verify(token, JWT_SECRET);
            let currMember = await member.findOne({ email: verify.username });
            // adding the donation in member schema
            donation
                .create({
                    amount: data.amount,
                    order_id: req.body.razorpay_order_id,
                    payment_id: req.body.razorpay_payment_id,
                    donationID: Date.now(),
                    donorID: currMember.memberID,
                    donationType: "memberFixedDonation",
                })
                .then(async (donateData) => {
                    console.log("donation data is ", donateData, currMember);
                    currMember.ownDonations.push(donateData.donationID);
                    const t = new Date(
                        new Date().setFullYear(new Date().getFullYear() + 1)
                    );
                    currMember.nextDueDate = t.getTime();
                    await currMember.save();
                    console.log(currMember);
                    // sending mail
                    memberDonationPDF(donateData, currMember, true);
                    // calling scheduler
                    scheduleforEveryDay(verify.username);
                });
        }
        console.log(response);
        return res.send(response);
    } catch (err) {
        console.log("error in member fixed donation", err);
        return res.json({ err });
    }
});

module.exports = router;
