const { swiggy, renderTemplate } = require("../config/nodemailer");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const moment = require("moment");

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

const dateConvertor = (date) => {
    let d = new Date(date).toLocaleString("en-CA", { timeZone: "Asia/Kolkata" });
    return d.substring(0, 10);
};

//-------------------------visitor online donation section --------------------//

//mailer
const visitorOnlineDonationMailer = async (donationData, visitorData) => {
    try {
        let wholeData = {
            donationData: donationData,
            visitorData: visitorData,
        };

        let htmlData = renderTemplate(
            wholeData,
            "visitorOnlineDonationContent.ejs"
        );
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
        return;
    } catch (err) {
        console.log("error in sending online visitor donation mail", err);
        return;
    }
};

//pdf generator

const visitorOnlineDonationPDF = async (
    donationData,
    visitorData,
    sendMail
) => {
    try {
        let ejsPath = path.join(
            __dirname,
            "../views/pdfTemplates/attachment/visitorOnlineDonationPDF.ejs"
        );

        fs.readFile(ejsPath, "utf-8", async (err, content) => {
            if (err) {
                console.log("error in reading file", err);
            }

            let misc = {
                date: dateConvertor(donationData.createdAt),
            };

            let cont = ejs.render(content, {
                visitor: visitorData,
                donation: donationData,
                misc: misc,
            });

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, "../public/pdf");
            await page
                .pdf({
                    path: `public/pdf/${donationData.donationID}.pdf`,
                    format: "a4",
                })
                .then(async () => {
                    console.log("file genreated successfully");
                    if (sendMail) {
                        console.log("sending mail");
                        await visitorOnlineDonationMailer(donationData, visitorData);
                    }
                });
            await browser.close();
            console.log("file generated");
        });
    } catch (err) {
        console.log(
            "error in generating pdf file for online visitor donation",
            err
        );
    }
};

//-----------------------------offline donation section ----------------------//

const offlineDonation = async (donationData, visitorData) => {
    try {
        // calling function to generate pdf
        let wholeData = {
            donationData: donationData,
            visitorData: visitorData,
        };
        let htmlData = renderTemplate(wholeData, "offlineDonationContent.ejs");
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
                console.log("mail sent successfully");
                fileRemover(
                    path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`)
                );
            });
    } catch (err) {
        console.log("error in sending offline upi donation mail", err);
    }
};

// pdf generation of offline recipts

const offlineDonationPDF = async (donationData, visitorData, sendMail) => {
    try {
        let ejsPath = path.join(
            __dirname,
            "../views/pdfTemplates/attachment/offlineDonationPDF.ejs"
        );

        fs.readFile(ejsPath, "utf-8", async (err, content) => {
            if (err) {
                console.log("error in reading file", err);
            }

            let misc = {
                date: dateConvertor(donationData.createdAt),
            };

            let cont = ejs.render(content, {
                visitor: visitorData,
                donation: donationData,
                misc: misc,
            });

            // console.log("content is ", cont);

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, "../public/pdf");
            await page
                .pdf({
                    path: `public/pdf/${donationData.donationID}.pdf`,
                    format: "a4",
                })
                .then(async () => {
                    console.log("file genreated successfully");
                    if (sendMail) {
                        await offlineDonation(donationData, visitorData);
                    }
                });
            await browser.close();
            console.log("file generated");
        });
    } catch (err) {
        console.log("error in generating pdf file for offline donation", err);
    }
};

//--------------------------------member donation section------------------------//

const memberDonation = async (donationData, memberData) => {
    try {
        // calling function to generate pdf
        let wholeData = {
            donationData: donationData,
            memberData: memberData,
        };

        let htmlData = renderTemplate(
            wholeData,
            `${donationData.donationType === "memberFixedDonation"
                ? "memberFixedDonationContent.ejs"
                : "memberNormalDonationContent.ejs"
            }`
        );
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
                console.log("mail sent successfully");
                fileRemover(
                    path.join(__dirname, `../public/pdf/${donationData.donationID}.pdf`)
                );
            });
    } catch (err) {
        console.log("error in sending offline upi donation mail", err);
    }
};

//pdf generation of member donation recipts
const memberDonationPDF = async (donationData, memberData, sendMail) => {
    try {
        let ejsPath = path.join(
            __dirname,
            "../views/pdfTemplates/attachment/memberDonationPDF.ejs"
        );

        fs.readFile(ejsPath, "utf-8", async (err, content) => {
            if (err) {
                console.log("error in reading file", err);
            }

            let misc = {
                date: dateConvertor(donationData.createdAt),
            };

            let cont = ejs.render(content, {
                member: memberData,
                donation: donationData,
                misc: misc,
            });

            // console.log("content is ", cont);

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, "../public/pdf");
            await page
                .pdf({
                    path: `public/pdf/${donationData.donationID}.pdf`,
                    format: "a4",
                })
                .then(async () => {
                    console.log("file genreated successfully");
                    if (sendMail) {
                        await offlineDonation(donationData, memberData);
                    }
                });
            await browser.close();
            console.log("file generated");
        });
    } catch (err) {
        console.log("error in generating pdf file for member donation", err);
    }
};

//-------------------------member registeration mailer ---------------------------//
const memberRegisterationMailer = async (member) => {
    try {
        let htmlData = renderTemplate(member, "memberRegisteration.ejs");
        swiggy
            .sendMail({
                from: "helpamission1@gmail.com",
                to: member.email,
                subject: "Registeration Successful",
                html: htmlData,
            })
            .then(() => {
                console.log("mail sent successfully");
            });
    } catch (err) {
        console.log("error in sending new registeration mail", err);
    }
};

//----------------------------------donation deadline mailer-----------------//
const donationDeadlineMailer = async (member) => {
    try {
        let htmlData = renderTemplate(member, "donationDeadline.ejs");
        swiggy
            .sendMail({
                from: "helpamission1@gmail.com",
                to: member.email,
                subject: "Donation Pending",
                html: htmlData,
            })
            .then(() => {
                console.log("mail sent successfully");
            });
    } catch (err) {
        console.log("error in sending new registeration mail", err);
    }
};

module.exports = {
    visitorOnlineDonationPDF,
    fileRemover,
    offlineDonationPDF,
    memberDonationPDF,
    memberRegisterationMailer,
    donationDeadlineMailer,
};
