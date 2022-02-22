const express = require('express');
const router = express.Router();
const { verifyMemberToken, verifyMemberLogin } = require('../../utils/memberauthprovider');
const jwt = require('jsonwebtoken');

router.get('/', (req, res) => {
    const { token } = req.cookies;
    if (verifyMemberToken(token)) {
        // const verify = jwt.verify(token, JWT_SECRET);
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
    console.log(req.body, 'hi');
    const { status, data } = await verifyMemberLogin(email, password);
    if (status === 'ok') {
        res.cookie('token', data);
        res.redirect('/member');
    } else {
        res.redirect('/member/login');
    }
});

module.exports = router;