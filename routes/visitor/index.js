const express = require('express');
const shortid = require("shortid");
const crypto = require("crypto");
const router = express.Router();
const Razorpay = require('razorpay');
const donation = require('../../models/donation');
const visitor = require('../../models/visitor');
require('dotenv').config();
const key_id = process.env.key_id;
const key_secret = process.env.key_secret;
const razorpay = new Razorpay({
    key_id,
    key_secret
});

router.post('/donation', async (req, res) => {
    const {
        vname,
        vbgroup,
        vmno,
        vemail,
        vdonationamount } = req.body;

    // checking for visitor 
    let check = await visitor.findOne({ contact: vmno });
    if (check) {
        console.log('visitor already available ', check)
    }
    if (!check) {
        let visitorData = await visitor.create({
            name: vname,
            bloodGroup: vbgroup,
            contact: vmno,
            email: vemail,
        });
        console.log('visitor successfully created ', visitorData);
    }
    const options = {
        amount: vdonationamount * 100,
        currency: "INR",
        receipt: shortid.generate(),
        payment_capture: 1
    };
    razorpay.orders.create(options, function (err, order) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            console.log(order);
            res.send(order);
        }
    });
});

router.post('/donation/verify', (req, res) => {
    const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    const { vdata } = req.body;
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
    if (response.status == 'success') {
        donation.create({
            amount: vdata.vdonationamount,
            order_id: req.body.razorpay_order_id,
            payment_id: req.body.razorpay_payment_id,
            donationID: Date.now()
        }).then((donateData) => {
            console.log('donation details are ', donateData);
            visitor.findOne({ contact: vdata.vmno }).then((data) => {
                if (data) {
                    let currDonations = [];
                    if (data.donations.length > 0) {
                        for (let i of data.donations) {
                            currDonations.push(i);
                        }
                    }
                    currDonations.push(donateData.donationID);
                    console.log('donations are ', currDonations);
                    visitor.findByIdAndUpdate(data.id, { donations: currDonations, contact: vdata.vmno, email: vdata.vemail }).then((updatedData) => {
                        console.log('successfully added new donation in ', updatedData);
                    });
                }
            })
        }).catch((err) => {
            console.log('error in adding new donation ', err);
        });
    }
    console.log(response);
    res.send(response);
});


module.exports = router;