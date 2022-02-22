const express = require('express');
const router = express.Router();

router.use('/visitor', require('./visitor/index'));
router.use('/member', require('./member/index'));
router.use('/admin', require('./admin/index'));

router.get('/', (req, res) => {
    return res.render('homepage');
})

module.exports = router;