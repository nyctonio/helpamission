const express = require('express');
const router = express.Router();
const bucket = require('../utils/cosmic');
const { verifyAdminToken, verifyAdminLogin } = require('../utils/adminauthprovider');
const jwt = require('jsonwebtoken');


router.use('/visitor', require('./visitor/index'));
router.use('/member', require('./member/index'));
router.use('/admin', require('./admin/index'));
router.use('/work', require('./work/index'));

router.get('/', async (req, res) => {
    try {
        const workData = await bucket.getObjects({
            query: {
                type: 'works'
            },
            props: 'slug,title,content,metadata,id'
        });

        const eventData = await bucket.getObjects({
            query: {
                type: 'events'
            },
            props: 'slug,title,content,metadata, id'
        });

        let pastEventsData = [];
        let upcomingEventsData = [];
        for (let i of eventData.objects) {
            let date = new Date(i.metadata.date);
            let today = Date.now();
            if (date < today) {
                pastEventsData.push(i);
            } else {
                upcomingEventsData.push(i);
            }
        }
        let data = {
            workData: workData,
            pastEventsData: pastEventsData,
            upcomingEventsData: upcomingEventsData
        }
        return res.render('homepage', {
            data: data
        });
    } catch (err) {
        console.log('error in rendering ', err);
    }
});




module.exports = router;