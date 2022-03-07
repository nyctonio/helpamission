const schedule = require('node-schedule');
const fs = require('fs');
const { donationDeadlineMailer } = require('../mailers/mailers');
const shedulingData = [];
const member = require('../models/memberauth');

const getAllShedulingData = () => {
    // member find
    // if(next > date.now)
    // every year(emal)
    //else
    // everyday(email)
}



const sheduleforEveryDay = (email) => {
    // check  
    schedule.scheduleJob('0 0 0 * * *', async () => {
        // next date 
        // 
        try {
            console.log('hii')
        }
        catch (err) {
            console.log('error in sheduleforEveryDay', err);
        }
    });
}

const sheduleforEveryYear = (email) => {
    // email nextpay 
    // 
    schedule.scheduleJob('0 0 0 1 1 *', async () => {

        try {
        }
        catch (err) {
            console.log('error in sheduleforEveryYear', err);
        }
    });
}



module.exports = { sheduleforEveryDay, sheduleforEveryYear };

