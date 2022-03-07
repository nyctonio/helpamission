const puppeteer = require('puppeteer');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const { onlineVisitorDonation, memberFixedDonation } = require('./mailers');

const onlineVisitorDonationPDF = async (donationData, visitorData) => {
    console.log('in online visitor donation pdf')
    try {

        fs.readFile('views/pdfTemplates/attachment/onlineVisitorDonationSlip.ejs', "utf-8", async (err, content) => {
            if (err) {
                console.log('error in reading file', err);
            }

            let cont = ejs.render(content, {
                data: {
                    visitorData: visitorData,
                    donationData: donationData
                }
            });
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, '../public/pdf');
            await page.pdf({
                path: `${filePath}/${donationData.donationID}.pdf`,
                format: 'a4'
            }).then(() => {
                console.log('file genreated successfully')
            });
            await browser.close();

            await onlineVisitorDonation(donationData, visitorData);
            // await fileRemover(`${filePath}/${donationData.donationID}.pdf`);
        });
    } catch (err) {
        console.log('error in generating pdf file for online visitor donation', err);
    }
}


// creating pdf for member fixed donation
const memberFixedDonationPDF = async (donationData, memberData) => {
    console.log('in member fixed donation pdf')
    try {

        fs.readFile('views/pdfTemplates/attachment/memberFixedDonationSlip.ejs', "utf-8", async (err, content) => {
            if (err) {
                console.log('error in reading file', err);
            }

            let cont = ejs.render(content, {
                data: {
                    memberData: memberData,
                    donationData: donationData
                }
            });


            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(cont);
            let filePath = path.join(__dirname, '../public/pdf');
            await page.pdf({
                path: `${filePath}/${donationData.donationID}.pdf`,
                format: 'a4'
            }).then(() => {
                console.log('file genreated successfully')
            });
            await browser.close();

            await memberFixedDonation(donationData, memberData);
        });
    } catch (err) {
        console.log('error in generating pdf file for online visitor donation', err);
    }
}


module.exports = { onlineVisitorDonationPDF, memberFixedDonationPDF }