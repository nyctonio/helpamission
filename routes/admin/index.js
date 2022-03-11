const express = require('express');
const router = express.Router();
const { verifyAdminToken, verifyAdminLogin } = require('../../utils/adminauthprovider');
const jwt = require('jsonwebtoken');

router.get('/', (req, res) => {
    const { token } = req.cookies;
    if (verifyAdminToken(token)) {
        // const verify = jwt.verify(token, JWT_SECRET);
        res.render('admin');
    } else {
        res.redirect('/admin/login')
    }
})

router.get('/login', (req, res) => {
    res.render('adminlogin');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body, 'hi');
    const { status, data } = await verifyAdminLogin(email, password);
    if (status === 'ok') {
        res.cookie('token', data);
        res.redirect('/admin');
    } else {
        res.redirect('/admin/login');
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
});

router.get('/get-members', (req, res) => {
    res.send('hi');
})

router.get('/get-transactions', (req, res) => {
    res.send('hi');
})



module.exports = router;