const express = require('express');
const router = express.Router();
const bucket = require('../../utils/cosmic');


router.get('/:slug', async (req, res) => {
    try {
        let data = await bucket.getObjects({
            type: 'works',
            props: 'slug,title,content,metadata',
            query: {
                "slug": req.params.slug
            }
        });
        data = data.objects[0];
        // console.log(data);
        return res.render('homepage/work', { data: data });
    } catch (err) {
        console.log('error in loading work');
        return res.send(err);
    }
})

module.exports = router;