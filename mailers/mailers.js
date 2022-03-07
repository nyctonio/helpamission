const { swiggy, renderTemplate } = require('../config/nodemailer');
const path = require('path');
const fs = require('fs');

// utility function for file removal
const fileRemover = async (filePath) => {
    console.log('in file remover');
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log('error in removing the temp file ', err);
        }
        console.log('file removed successfully');
    })
}


// mailer for online visitor donation slip
const onlineVisitorDonation = async (donationData, visitorData) => {
    try {
        let wholeData = {
            donationData: donationData,
            visitorData: visitorData
        }

        let filePath = path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`);
        console.log('file path is ', filePath);

        let htmlData = renderTemplate(wholeData, 'onlineVisitorDonation.ejs');
        swiggy.sendMail({
            from: 'helpamission1@gmail.com',
            to: visitorData.email,
            subject: "Donation Successful",
            html: htmlData,
            attachments: [
                {
                    filename: `${donationData.donationID}.pdf`,
                    path: path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`)
                }
            ]
        }).then(() => {
            fileRemover(path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`))
        });

        console.log('mail sent successfully')
    } catch (err) {
        console.log('error in sending online visitor donation mail', err);
    }
}


// mailer for new registeration of member
const memberRegisterationMailer = async (memberDetails) => {
    try {
        // console.log(memberDetails);
        let htmlData = renderTemplate(memberDetails, 'memberRegisteration.ejs');
        swiggy.sendMail({
            from: 'helpamission1@gmail.com',
            to: memberDetails.email,
            subject: "Registeration Successful",
            html: htmlData
        });

        console.log('mail sent successfully for memberRegisterationMailer')
    } catch (err) {
        console.log('error in sending member registeration mail', err);
    }
}

// mailer for donation deadline
const donationDeadlineMailer = async (memberDetails) => {
    try {
        let htmlData = renderTemplate(memberDetails, 'donationDeadline.ejs');
        swiggy.sendMail({
            from: 'helpamission1@gmail.com',
            to: memberDetails.email,
            subject: "Donation Pending",
            html: htmlData
        });

        console.log('mail sent successfully for memberRegisterationMailer')
    } catch (err) {
        console.log('error in sending member registeration mail', err);
    }
};

// member yearly amount submission
const memberFixedDonation = async (donationData, memberData) => {
    try {
        let wholeData = {
            donationData: donationData,
            memberData: memberData
        }

        let filePath = path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`);
        console.log('file path is ', filePath);

        let htmlData = renderTemplate(wholeData, 'memberFixedDonation.ejs');
        swiggy.sendMail({
            from: 'helpamission1@gmail.com',
            to: memberData.email,
            subject: "Donation Successful",
            html: htmlData,
            attachments: [
                {
                    filename: `${donationData.donationID}.pdf`,
                    path: path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`)
                }
            ]
        }).then(() => {
            fileRemover(path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`))
        });

        console.log('mail sent successfully')
    } catch (err) {
        console.log('error in sending member fixed donation mail', err);
    }
}


module.exports = { onlineVisitorDonation, memberRegisterationMailer, memberFixedDonation, donationDeadlineMailer };