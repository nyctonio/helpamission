const schedule = require("node-schedule");
const member = require("../models/memberauth");
const donationDeadlineMailer = require("../mailers/mailer");

const getAllSchedulingData = async () => {
  console.log("getAllSchedulingData");
  let membersData = await member.find({}).sort({
    createdAt: -1,
  });
  for (let i of membersData) {
    if (i.nextDueDate > Date.now()) {
      scheduleforEveryYear(i.email);
    } else {
      console.log("scheduling for everyday");
      scheduleforEveryDay(i.email);
    }
  }
};

const scheduleforEveryDay = async (email) => {
  schedule.scheduleJob(`${email}notification`, "00 14 * * FRI", async () => {
    try {
      let memberData = await member.findOne({ email });
      if (
        memberData.nextDueDate > Date.now() ||
        Date.now() - memberData.nextDueDate > 3888000000
      ) {
        schedule.cancelJob(`${memberData.email}notification`);
        console.log("Terminated ", memberData.memberID);
        scheduleforEveryYear(memberData.email);
      } else {
        await donationDeadlineMailer(memberData);
        console.log("sending mail");
      }
    } catch (err) {
      console.log("error in sheduleforEveryDay", err);
    }
  });
};

const scheduleforEveryYear = async (email) => {
  let memberData = await member.findOne({ email });
  let c = await memberData.nextDueDate;
  console.log("scheduled next year for ", c, email);
  schedule.scheduleJob(c, async () => {
    scheduleforEveryDay(memberData.email);
  });
};

module.exports = {
  scheduleforEveryDay,
  scheduleforEveryYear,
  getAllSchedulingData,
};
