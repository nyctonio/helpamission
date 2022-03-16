const express = require("express");
const shortid = require("shortid");
const crypto = require("crypto");
const router = express.Router();
const Razorpay = require("razorpay");
const { donation, visitor, wheel } = require("../../models");
const { visitorOnlineDonationPDF } = require("../../mailers/mailer");
require("dotenv").config();
const key_id = process.env.key_id;
const key_secret = process.env.key_secret;
const razorpay = new Razorpay({
  key_id,
  key_secret,
});

router.post("/donation", async (req, res) => {
  const { vname, vbgroup, vmno, vemail, vdonationamount, vaddress } = req.body;

  // checking for visitor
  let check = await visitor.findOne({ contact: vmno });
  if (check) {
    console.log("visitor already available ", check);
  }
  if (!check) {
    let visitorData = await visitor.create({
      name: vname,
      bloodGroup: vbgroup,
      contact: vmno,
      email: vemail,
      address: vaddress,
    });
    console.log("visitor successfully created ", visitorData);
  }
  const options = {
    amount: vdonationamount * 100,
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
      res.send(order);
    }
  });
});

router.post("/getwheelchair", async (req, res) => {
  try {
    console.log("req.body ", req.body);
    let wheelData = await wheel.create({ ...req.body });
    console.log(wheelData);
    res.send({ status: true, data: wheelData });
  } catch (error) {
    console.log(error);
    res.json({ status: false, error: error });
  }
});

router.post("/donation/verify", (req, res) => {
  const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
  const { vdata } = req.body;
  console.log(req.body);
  let visitorData = {};
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
    donation
      .create({
        amount: vdata.vdonationamount,
        order_id: req.body.razorpay_order_id,
        payment_id: req.body.razorpay_payment_id,
        donationID: Date.now(),
      })
      .then(async (donateData) => {
        console.log("donation details are ", donateData);
        const currvisitor = await visitor.findOne({ contact: vdata.vmno });
        currvisitor.donations.push(donateData.donationID);
        await currvisitor.save();
        visitorData.name = currvisitor.name;
        visitorData.email = currvisitor.email;
        await visitorOnlineDonationPDF(donateData, visitorData, true);
      })
      .catch((err) => {
        console.log("error in adding new donation ", err);
      });
  }
  console.log(response);
  res.send(response);
});

module.exports = router;
