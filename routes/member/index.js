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
  visitorOnlineDonationPDF,
  fileRemover,
} = require("../../mailers/mailer");
const JWT_SECRET = process.env.jwt;
require("dotenv").config();
const key_id = process.env.key_id;
const key_secret = process.env.key_secret;
const razorpay = new Razorpay({
  key_id,
  key_secret,
});
const fs = require("fs");

// image upload multer
const multer = require("multer");
const fileUpload = multer();
const uploadImage = require("../../config/cloudinary");
router.post(
  "/profilepicture",
  fileUpload.single("profilepicture"),
  (req, res) => {
    uploadImage(req).then(async (result) => {
      const { token } = req.cookies;
      const verify = jwt.verify(token, JWT_SECRET);
      const data = await member.findOneAndUpdate(
        {
          email: verify.username,
        },
        {
          image: result.secure_url,
        }
      );
      res.redirect("/member/profile-section");
    });
  }
);

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
    // console.log(`Number of added members are ${addedMembers.length}.
    //     Own donations are ${sumOwnDonations}.
    //     Other Donations are ${sumOtherDonations}. Donation for this cycle is ${paidStatus}`);
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

router.get("/addmember", async (req, res) => {
  const { token } = req.cookies;
  if (verifyMemberToken(token)) {
    const verify = jwt.verify(token, JWT_SECRET);
    let currMember = await member.findOne({ email: verify.username });
    if (currMember.hasAddPower == true) {
      res.render("member/addmembers");
    } else {
      res.send("<h1>Access Denied</h1>");
    }
  } else {
    res.redirect("/member/login");
  }
});

router.get("/offline-donation", async (req, res) => {
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
    info.refferdBy = currMemberData.memberID;
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
    res.redirect("/member/addmember");
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
    // res.send(profiledata);
    return res.render("member/profilesection", { profiledata });
  } catch (err) {
    console.log(err);
    return res.json({ err });
  }
});

// update member details & change profile photo
// router.post(
//   "/update-profile-photo/:memberID",
//   upload.single("profile-file"),
//   async (req, res) => {
//     try {
//       await member.findOneAndUpdate(
//         { memberID: req.params.memberID },
//         { image: req.file.path }
//       );
//       return res.send({ status: true });
//     } catch (err) {
//       console.log("error in uploading profile photo", err);
//       return;
//     }
//   }
// );

router.post("/update-member-details", async (req, res) => {
  try {
    console.log("body is ", req.body);
    await member.findOneAndUpdate(
      { memberID: req.body.memberID },
      {
        name: req.body.name,
        email: req.body.email,
        contact: req.body.contact,
        address: req.body.address,
        bloodGroup: req.body.bloodGroup,
      }
    );
    console.log("updated");
    return res.redirect("back");
  } catch (err) {
    console.log("error in updating the details");
    return res.redirect("back");
  }
});

const helper = async (donationDetails) => {
  switch (donationDetails.donationType) {
    case "visitorOnlineDonation":
      var visitorDetails = await getVisitorDetails(donationDetails.donationID);
      await visitorOnlineDonationPDF(donationDetails, visitorDetails, false);
      break;
    case "memberFixedDonation":
      var memberDetails = await getMemberDetails(donationDetails.donorID);
      await memberDonationPDF(donationDetails, memberDetails, false);
      break;
    case "memberNormalDonation":
      var memberDetails = await getMemberDetails(donationDetails.donorID);
      await memberDonationPDF(donationDetails, memberDetails, false);
      break;
    case "offlineUpiDonation":
      console.log("in offline upi donation");
      var visitorDetails = await getVisitorDetails(donationDetails.donationID);
      await offlineDonationPDF(donationDetails, visitorDetails, false);
      break;
    case "offlineCashDonation":
      console.log("in offline cash donation");
      var visitorDetails = await getVisitorDetails(donationDetails.donationID);
      console.log("visitor details are", visitorDetails);
      await offlineDonationPDF(donationDetails, visitorDetails, false);
      break;
  }
};

// file downloader
router.get("/download-slip/:donationID", async (req, res, next) => {
  try {
    let donationDetails = await donation.findOne({
      donationID: req.params.donationID,
    });

    let file = path.join(
      __dirname,
      `../../public/pdf/${donationDetails.donationID}.pdf`
    );

    const fileDownloader = () => {
      if (fs.existsSync(file)) {
        console.log("file present");
        if (file !== "/") {
          res.download(file, async function (err) {
            if (err) {
              console.log("error in downloading", err);
            } else {
              console.log("successfully downloaded the file");
            }
            setTimeout(() => {
              fileRemover(file);
            }, 0000);
          });
        } else {
          console.log("file not present");
          next();
        }
      } else {
        console.log("recursive call of file Downloader");
        setTimeout(() => {
          fileDownloader();
        }, 4000);
      }
    };
    await helper(donationDetails).then(() => {
      console.log("executing fileDownloader main");
      fileDownloader();
    });
  } catch (err) {
    console.log("error in downloading the slip", err);
    return res.json({ err });
  }
});
// offline donation
router.post("/offline-donation", async (req, res) => {
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
      vdate,
    } = req.body;
    console.log(req.body);
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
      isVerified: false,
      donationType,
      createdAt: Date.parse(vdate),
    });

    console.log("temp date is ", Date.parse(vdate));
    await offlineDonationPDF(donationData, visitorData, true);
    console.log("donation successfully created ", donationData);
    // updating member donation
    currMember.otherDonations.push(donationData.donationID);
    await currMember.save();
    // updaing visitor donations
    visitorData.donations.push(donationData.donationID);
    await visitorData.save();
    return res.send({ status: true });
  } catch (err) {
    console.log("error in creating donation for member ", err);
    return res.send({ status: false });
  }
});

router.post("/update-offline-donation", async (req, res) => {
  try {
    console.log("req.body is ", req.body);
    const donationType =
      req.body.vpaymentmode === "UPI"
        ? "offlineUpiDonation"
        : "offlineCashDonation";

    await donation.findOneAndUpdate(
      { donationID: req.body.donationID },
      {
        amount: req.body.vdonationamount,
        donationType: donationType,
      }
    );
    console.log("updated donation is ", updatedDonation);
    return res.redirect("back");
  } catch (err) {
    console.log("error in updating offline donation", err);
    return res.redirect("back");
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
    donation
      .create({
        amount: data.amount,
        order_id: req.body.razorpay_order_id,
        payment_id: req.body.razorpay_payment_id,
        donationID: Date.now(),
        donorID: currMember.memberID,
        donationType: "memberNormalDonation",
      })
      .then(async (donateData) => {
        // console.log("donation data is ", donateData, currMember);
        currMember.ownDonations.push(donateData.donationID);
        await currMember.save();
        // sending mail for pdf reciept
        await memberDonationPDF(donateData, currMember, true);
      })
      .catch((err) => {
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
