const express = require("express");
const router = express.Router();
const {
  verifyAdminToken,
  verifyAdminLogin,
} = require("../../utils/adminauthprovider");
const jwt = require("jsonwebtoken");
const {
  memberDataFetcher,
  transactionDataFetcher,
  fixedDonationFetcher,
  wheelChairDataFetcher,
  homePageDataFetcher,
  hashPassword,
  visitorDataFetcher,
} = require("./adminutils");
const { member, donation } = require("../../models");
const {
  scheduleforEveryDay,
  scheduleforEveryYear,
} = require("../../utils/sheduler");
const wheel = require("../../models/wheel");
const {
  requestApprovedMailer,
  memberRegisterationMailer,
  memberDonationPDF,
  wheelChairMailer,
} = require("../../mailers/mailer");

router.get("/", async (req, res) => {
  const { token } = req.cookies;
  if (verifyAdminToken(token)) {
    // const verify = jwt.verify(token, JWT_SECRET);
    let data = await homePageDataFetcher();
    console.log(data);
    // res.send(data);
    res.render("admin", { dashboarddata: data });
  } else {
    res.redirect("/admin/login");
  }
});

router.get("/login", (req, res) => {
  res.render("adminlogin");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body, "hi");
  const { status, data } = await verifyAdminLogin(email, password);
  if (status === "ok") {
    res.cookie("token", data);
    res.redirect("/admin");
  } else {
    res.redirect("/admin/login");
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/admin/login");
});

const { performance } = require("perf_hooks");

router.get("/member", async (req, res) => {
  try {
    console.log("start", performance.now());
    let data = await memberDataFetcher();
    let paymentData = await fixedDonationFetcher();
    // console.log(data);
    console.log("end", performance.nodeTiming);
    // res.send(data);
    res.render("admin/members", { memberdata: data, paymentdata: paymentData });
  } catch (err) {
    console.log(err);
  }
});

router.post("/addmember", async (req, res) => {
  try {
    const info = { ...req.body, password: "", memberID: "" };
    let normalPassword = `${req.body.city}${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    console.log(normalPassword);
    info.password = await hashPassword(normalPassword);
    info.memberID = "HAM" + Math.floor(1000 + Math.random() * 9000);
    // creating new member
    await member.create({ ...info }, async (err, newMember) => {
      if (err) {
        throw err;
      } else {
        // sending mail to the new member
        memberRegisterationMailer({ ...newMember._doc, normalPassword });
        // console.log('new', newMember);
        scheduleforEveryDay(newMember.email);
        scheduleforEveryYear(newMember.email);
      }
    });
    res.redirect("/admin/member");
  } catch (error) {
    console.log(error);
    return res.json({ error });
  }
});

router.post("/update-member/:memberID", async (req, res) => {
  try {
    await member.findOneAndUpdate({ memberID: req.params.memberID }, req.body);
    return res.send({ msg: "updated successfully" });
  } catch (err) {
    console.log("error in updating member details", err);
    return res.send({ msg: "problem" });
  }
});

router.post("/delete-member/:memberID", async (req, res) => {
  try {
    console.log(req.params.memberID);
    let currMember = await member.findOneAndDelete({
      memberID: req.params.memberID,
    });
    console.log(currMember);
    let referringMember = await member.findOne({
      memberID: currMember.refferdBy,
    });
    console.log(referringMember);
    if (referringMember) {
      const eligible = (id) => {
        return id !== req.params.memberID;
      };
      referringMember.addedMembers =
        referringMember.addedMembers.filter(eligible);
      console.log("after filter", referringMember);
      await referringMember.save();
    }
    return res.send({ msg: "changed" });
  } catch (err) {
    console.log(err);
    res.send({ msg: "error" });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    let data = await transactionDataFetcher();
    // res.send(data);
    res.render("admin/transactions", { transactiondata: data });
  } catch (err) {
    return res.send({ err: err });
  }
});

// approving offline donation
router.post("/verify-offline-donation/:id", async (req, res) => {
  try {
    let donationData = await donation.findOne({ donationID: req.params.id });
    donationData.isVerified = true;
    await donationData.save();
    console.log("updated");
    return res.redirect("back");
  } catch (err) {
    console.log("error in approving", err);
    return res.redirect("back");
  }
});

router.get("/manage-fixed-payments", async (req, res) => {
  try {
    let paymentData = await fixedDonationFetcher();
    return res.send(paymentData);
  } catch (err) {
    console.log("error in fetching data of fixed payments");
    return res.send({ msg: "some err" });
  }
});

router.get("/chairs", async (req, res) => {
  try {
    let data = await wheelChairDataFetcher();
    res.render("admin/wheels", { wheeldata: data });
    // res.send(data)
  } catch (err) {
    console.log("error in fetching wheel chair data");
    return res.send(err);
  }
});

router.post("/approve-wheelchair/:reqID", async (req, res) => {
  try {
    let wheelData = await wheel.findById(req.params.reqID);
    wheelData.isIssued = true;
    wheelData.issueDate = Date.now();
    await wheelData.save();
    await wheelChairMailer(wheelData);
    return res.send({ status: true });
  } catch (err) {
    console.log("error in approving the req", err);
    return res.send({ status: false });
  }
});

router.post("/return-wheelchair/:reqID", async (req, res) => {
  try {
    let updateObj = {
      isReturned: true,
      returnDate: Date.now(),
    };
    await wheel.findByIdAndUpdate(req.params.reqID, updateObj);
    return res.send({ status: true });
  } catch (err) {
    console.log("error in approving the req", err);
    return res.send({ status: false });
  }
});

router.post("/reject-wheelchair/:reqID", async (req, res) => {
  try {
    await wheel.findByIdAndRemove(req.params.reqID);
    return res.send({ status: true });
  } catch (err) {
    console.log("eror in rejecting the req", err);
    return res.send({ status: false });
  }
});

router.post("/member-fixed-donation", async (req, res) => {
  try {
    let fixedAmount = 1100;
    let currMember = await member.findOne({ memberID: req.body.memberID });
    console.log("curr member is ", currMember);
    let newDonation = await donation.create({
      amount: fixedAmount,
      order_id: "N/A",
      payment_id: "N/A",
      donationID: Date.now(),
      donorID: currMember.memberID,
      donationType: "memberFixedDonation",
    });

    currMember.ownDonations.push(newDonation.donationID);
    const t = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    currMember.nextDueDate = t.getTime();
    await currMember.save();
    console.log(currMember);
    // sending mail
    memberDonationPDF(newDonation, currMember, true);
    // calling scheduler
    scheduleforEveryDay(currMember.email);

    return res.redirect("back");
  } catch (err) {
    console.log("error in member-fixed-donation in admin panel", err);
    return res.send({ status: false });
  }
});

router.post("/member-normal-donation", async (req, res) => {
  try {
    let fixedAmount = req.body.vdonationamount;
    let currMember = await member.findOne({ memberID: req.body.memberID });
    console.log("curr member is ", currMember);
    let newDonation = await donation.create({
      amount: fixedAmount,
      order_id: "N/A",
      payment_id: "Issued By Admin",
      donationID: Date.now(),
      donorID: currMember.memberID,
      donationType: "memberNormalDonation",
    });

    currMember.ownDonations.push(newDonation.donationID);
    await currMember.save();
    console.log(currMember);
    // sending mail
    memberDonationPDF(newDonation, currMember, true);
    return res.redirect("back");
  } catch (err) {
    console.log("error in member-normal-donation in admin panel", err);
    return res.send({ status: false });
  }
});

router.get("/visitor", async (req, res) => {
  try {
    let mainData = await visitorDataFetcher();
    return res.render("admin/visitor", {
      visitordata: mainData,
    });
  } catch (err) {
    console.log("error in fetching visitor data");
    return res.send(err);
  }
});

router.post("/give-add-power/:memberID", async (req, res) => {
  try {
    let currMember = await member.findOne({ memberID: req.params.memberID });
    currMember.hasAddPower = true;
    await currMember.save();
    console.log("after updation is ", currMember);
    console.log("given");
    res.redirect("back");
  } catch (err) {
    console.log("error in giving power", err);
    return res.redirect("back");
  }
});

module.exports = router;
