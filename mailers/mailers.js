const { swiggy, renderTemplate } = require("../config/nodemailer");
const path = require("path");
const { visitorOnlineDonationPDF } = require("./pdfGenerators");
const fs = require("fs").promises;

// utility function for file removal
const fileRemover = async (filePath) => {
    console.log("in file remover");
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log("error in removing the temp file ", err);
        }
        console.log("file removed successfully");
    });
};

//----------------------Donation Slips Secions   ----------------------------//

// visitor online donation

const visitorOnlineDonation = async (donationData, visitorData) => {
    try {
        // calling function to generate pdf
        await visitorOnlineDonationPDF(donationData, visitorData);
        let wholeData = {
            donationData: donationData,
            visitorData: visitorData,
        };

        let htmlData = renderTemplate(wholeData, "content/visitorOnlineDonationContent.ejs");
        swiggy
            .sendMail({
                from: "helpamission1@gmail.com",
                to: visitorData.email,
                subject: "Donation Successful",
                html: htmlData,
                attachments: [
                    {
                        filename: `${donationData.donationID}.pdf`,
                        path: path.join(
                            __dirname,
                            `../public/pdf/${donationData.donationID}.pdf`
                        ),
                    },
                ],
            })
            .then(() => {
                fileRemover(
                    path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`)
                );
            });
    } catch (err) {
        console.log("error in sending online visitor donation mail", err);
    }
};

// memberFixedDonation

const memberFixedDonation = async () => { };

// member normal donation

const memberNormalDonation = async () => { };

// offline upi donation

const offlineDonation = async (donationData, visitorData) => {
    try {
        const { amount, donationID, } = donationData;
        // console.log(memberDetails);
        let htmlData = renderTemplate(memberDetails, 'content/memberRegisteration.ejs');
        swiggy.sendMail({
            from: 'helpamission1@gmail.com',
            to: memberDetails.email,
            subject: "Registeration Successful",
            html: htmlData
        });
    } catch (err) {
        console.log("error in sending offline donation mail", err);
    }
};



// new member registeration mail

// mailer for new registeration of member
const memberRegisterationMailer = async (memberDetails) => {
    try {
        // console.log(memberDetails);
        let htmlData = renderTemplate(memberDetails, 'content/memberRegisteration.ejs');
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



module.exports = { visitorOnlineDonation, fileRemover, memberFixedDonation, memberRegisterationMailer, memberNormalDonation, offlineDonation };