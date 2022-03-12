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
} = require("./adminutils");
const { member } = require("../../models");
const wheel = require("../../models/wheel");
const { requestApprovedMailer } = require("../../mailers/mailer");

router.get("/", (req, res) => {
    const { token } = req.cookies;
    if (verifyAdminToken(token)) {
        // const verify = jwt.verify(token, JWT_SECRET);
        res.render("admin");
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

const { performance } = require('perf_hooks');

router.get("/member", async (req, res) => {
    try {
        console.log('start', performance.now());
        let data = await memberDataFetcher();
        // console.log(data);
        console.log('end', performance.nodeTiming);
        // res.send(data);
        res.render('admin/members', { memberdata: data });
    } catch (err) {
        console.log(err);
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

router.get("/transactions", async (req, res) => {
    try {
        let data = await transactionDataFetcher();
        // res.send(data);
        res.render('admin/transactions', { transactiondata: data });
    } catch (err) {
        return res.send({ err: err });
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
        return res.send(data);
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
        await requestApprovedMailer(wheelData);
        return res.send({ msg: "updated" });
    } catch (err) {
        console.log("error in approving the req", err);
        return res.send({ err: err });
    }
});

router.post("/return-wheelchair/:reqID", async (req, res) => {
    try {
        let updateObj = {
            isReturned: true,
            returnDate: Date.now(),
        };
        await wheel.findByIdAndUpdate(req.params.reqID, updateObj);
        return res.send({ msg: "returned" });
    } catch (err) {
        console.log("error in approving the req", err);
        return res.send({ err: err });
    }
});

router.post("/reject-wheelchair/:reqID", async (req, res) => {
    try {
        await wheel.findByIdAndDelete(req.params.reqID);
        return res.send({ msg: "rejected successfully" });
    } catch (err) {
        console.log("eror in rejecting the req", err);
        return res.send({ msg: "err" });
    }
});

module.exports = router;
