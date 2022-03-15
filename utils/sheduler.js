const schedule = require("node-schedule");
const { donationDeadlineMailer } = require("../mailers/mailer");
const member = require("../models/memberauth");

const getAllSchedulingData = async () => {
  console.log("getAllSchedulingData");
  let membersData = await member.find({});
  for (let i of membersData) {
    if (i.nextDueDate > Date.now()) {
      scheduleforEveryYear(i.email);
    } else {
      scheduleforEveryDay(i.email);
    }
  }
};

const scheduleforEveryDay = async (email) => {
  schedule.scheduleJob(`${email}notification`, "38 21 * * *", async () => {
    try {
      let memberData = await member.findOne({ email });
      if (memberData.nextDueDate > Date.now()) {
        schedule.cancelJob(`${memberData.email}notification`);
        console.log("Terminated ", memberData.memberID);
        scheduleforEveryYear(memberData.email);
      } else {
        console.log("sending mail");
        await donationDeadlineMailer(memberData);
      }
    } catch (err) {
      console.log("error in sheduleforEveryDay", err);
    }
  });
};

const scheduleforEveryYear = async (email) => {
  let memberData = await member.findOne({ email });
  let c = await memberData.nextDueDate;
  console.log("scheduled next year for ", c);
  schedule.scheduleJob(c, async () => {
    scheduleforEveryDay(memberData.email);
  });
};

module.exports = {
  scheduleforEveryDay,
  scheduleforEveryYear,
  getAllSchedulingData,
};
