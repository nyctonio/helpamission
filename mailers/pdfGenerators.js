const puppeteer = require("puppeteer");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const { visitorOnlineDonation } = require("./mailers");

// online visitor donation slip generator
const visitorOnlineDonationPDF = async (donationData, visitorData) => {
    try {
        let ejsPath = path.join(
            __dirname,
            "../views/pdfTemplates/attachment/visitorOnlineDonationPDF.ejs"
        );

        fs.readFile(ejsPath, "utf-8", async (err, content) => {
            if (err) {
                console.log("error in reading file", err);
            }

            let cont = ejs.render(content, {
                data: {
                    visitorData: visitorData,
                    donationData: donationData,
                },
            });


            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, "../public/pdf");
            await page
                .pdf({
                    path: `public/pdf/${donationData.donationID}.pdf`,
                    format: "a4",
                })
                .then(() => {
                    console.log("file genreated successfully");
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

// member fixed donation slip generator
const memberFixedDonationPDF = async (donationData, memberData) => {
    try {
        let ejsPath = path.join(
            __dirname,
            "../views/pdfTemplates/attachment/memberFixedDonationPDF.ejs"
        );

        fs.readFile(ejsPath, "utf-8", async (err, content) => {
            if (err) {
                console.log("error in reading file", err);
            }

            let cont = ejs.render(content, {
                data: {
                    visitorData: visitorData,
                    donationData: donationData,
                },
            });

            console.log("content is ", cont);

            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, "../public/pdf");
            await page
                .pdf({
                    path: `public/pdf/${donationData.donationID}.pdf`,
                    format: "a4",
                })
                .then(() => {
                    console.log("file genreated successfully");
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

// member normal donation slip generator
const memberNormalDonationPDF = async (donationData, memberData) => {
    try {
        let ejsPath = path.join(
            __dirname,
            "../views/pdfTemplates/attachment/memberNormalDonationPDF.ejs"
        );

        fs.readFile(ejsPath, "utf-8", async (err, content) => {
            if (err) {
                console.log("error in reading file", err);
            }

            let cont = ejs.render(content, {
                data: {
                    visitorData: visitorData,
                    donationData: donationData,
                },
            });

            console.log("content is ", cont);

            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, "../public/pdf");
            await page
                .pdf({
                    path: `public/pdf/${donationData.donationID}.pdf`,
                    format: "a4",
                })
                .then(() => {
                    console.log("file genreated successfully");
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

// offline upi donation slip
const offlineUpiDonationPDF = async (donationData, visitorData) => {
    try {
        let ejsPath = path.join(
            __dirname,
            "../views/pdfTemplates/attachment/offlineUpiDonationPDF.ejs"
        );

        fs.readFile(ejsPath, "utf-8", async (err, content) => {
            if (err) {
                console.log("error in reading file", err);
            }

            let cont = ejs.render(content, {
                data: {
                    visitorData: visitorData,
                    donationData: donationData,
                },
            });

            console.log("content is ", cont);

            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, "../public/pdf");
            await page
                .pdf({
                    path: `public/pdf/${donationData.donationID}.pdf`,
                    format: "a4",
                })
                .then(() => {
                    console.log("file genreated successfully");
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

// offline cash donation slip
const offlineCashDonationPDF = async (donationData, visitorData) => {
    try {
        let ejsPath = path.join(
            __dirname,
            "../views/pdfTemplates/attachment/offlineCashDonationPDF.ejs"
        );

        fs.readFile(ejsPath, "utf-8", async (err, content) => {
            if (err) {
                console.log("error in reading file", err);
            }

            let cont = ejs.render(content, {
                data: {
                    visitorData: visitorData,
                    donationData: donationData,
                },
            });

            console.log("content is ", cont);

            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, "../public/pdf");
            await page
                .pdf({
                    path: `public/pdf/${donationData.donationID}.pdf`,
                    format: "a4",
                })
                .then(() => {
                    console.log("file genreated successfully");
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

module.exports = {
    visitorOnlineDonationPDF,
    memberFixedDonationPDF,
    memberNormalDonationPDF,
    offlineCashDonationPDF,
    offlineUpiDonationPDF,
};
