const express = require("express");
const { verifyAdminMiddleware } = require("../utils/adminauthprovider");
const router = express.Router();
const bucket = require("../utils/cosmic");
const { verifyMemberMiddleware } = require("../utils/memberauthprovider");
// const { verifyAdminToken, verifyAdminLogin } = require('../utils/adminauthprovider');
// const jwt = require('jsonwebtoken');

router.use("/visitor", require("./visitor/index"));
router.use("/member", verifyMemberMiddleware, require("./member/index"));
router.use("/admin", verifyAdminMiddleware, require("./admin/index"));
router.use("/work", require("./work/index"));

router.get("/", async (req, res) => {
  try {
    const workData = await bucket.getObjects({
      query: {
        type: "works",
      },
      props: "slug,title,content,metadata,id",
    });

    const eventData = await bucket.getObjects({
      query: {
        type: "events",
      },
      props: "slug,title,content,metadata, id",
    });

    const missionContent = await bucket.getObject({
      id: "6236d5c642bd110009e7919c",
      props: "slug,title,content",
    });

    const missionImages = await bucket.getObjects({
      query: {
        type: "mission-images",
      },
      props: "slug, content, metadata",
    });

    // console.log("mission content is ", missionContent);
    // console.log("missionImages are ", missionImages.objects[0]);

    let missionContentData = missionContent.object.content;
    let missionImagesData = [];
    for (let i of missionImages.objects) {
      missionImagesData.push(i.metadata.image.imgix_url);
    }

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

    console.log("final content is ", missionContentData, missionImagesData);
    let data = {
      workData: workData,
      pastEventsData: pastEventsData,
      upcomingEventsData: upcomingEventsData,
      missionContentData: missionContentData,
      missionImagesData: missionImagesData,
    };
    return res.render("homepage", {
      data: data,
    });
  } catch (err) {
    console.log("error in rendering ", err);
  }
});

router.get("/team", async (req, res) => {
  const teamData = await bucket.getObjects({
    query: {
      type: "members",
    },
    props: "metadata",
  });

  let memberData = [];

  for (let i of teamData.objects) {
    let temp = {
      name: i.metadata.name,
      designation: i.metadata.designation,
      image: i.metadata.memberimage.imgix_url,
      rank: i.metadata.rank,
      contact: i.metadata.contact,
    };

    memberData.push(temp);
  }

  function compare(a, b) {
    if (a.rank <= b.rank) {
      return -1;
    }
    if (a.rank > b.rank) {
      return 1;
    }
    return 0;
  }

  memberData.sort(compare);
  console.log("team data is ", memberData);

  res.render("homepage/team", {
    membersdata: memberData,
  });
});

module.exports = router;
