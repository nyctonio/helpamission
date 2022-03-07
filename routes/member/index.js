const express = require('express');
const router = express.Router();  // fs path schedule
const jwt = require('jsonwebtoken');
const { hashPassword } = require('./memberutils');
const JWT_SECRET = process.env.jwt;
const member = require('../../models/memberauth');
const { verifyMemberToken, verifyMemberLogin } = require('../../utils/memberauthprovider');
const { sheduleforEveryDay, sheduleforEveryYear } = require('../../utils/sheduler');
const { memberRegisterationMailer } = require('../../mailers/mailers');
const { memberFixedDonationPDF } = require('../../mailers/pdfGenerators');


router.get('/', (req, res) => {
    const { token } = req.cookies;
    if (verifyMemberToken(token)) {
        res.render('member');
    } else {
        res.redirect('/member/login')
    }
})

router.get('/login', (req, res) => {
    res.render('memberlogin');
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { status, data } = await verifyMemberLogin(email, password);
    if (status === 'ok') {
        res.cookie('token', data);
        res.redirect('/member');
    } else {
        res.redirect('/member/login');
    }
});

router.post('/logout', async (req, res) => {
    res.clearCookie("token");
    res.redirect('/member/login');
});

router.get('/addmember', (req, res) => {
    const { token } = req.cookies;
    if (verifyMemberToken(token)) {
        res.render('member/addmembers');
    } else {
        res.redirect('/member/login')
    }
});


router.post('/addmember', async (req, res) => {
    try {
        const info = { ...req.body, password: '', refferdBy: '', memberID: '' };
        let normalPassword = `${req.body.city}${Math.floor(1000 + Math.random() * 9000)}`;
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
                sheduleforEveryDay(newMember.email);
                sheduleforEveryYear(newMember.email);
                currMemberData.addedMembers.push(info.memberID);
                currMemberData.save();
            }
        });
        console.log(newmem);
        res.json({ status: 'ok' });
    } catch (error) {
        console.log(error);
        return res.json({ error, });
    }
});

module.exports = router;