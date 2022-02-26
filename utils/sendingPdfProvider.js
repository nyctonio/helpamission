const ejs = require('ejs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { sendFile } = require('../config/nodemailer');

const amountConversion = (amount) => {
    var a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    var b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function inWords(num) {
        if ((num = num.toString()).length > 9) return 'overflow';
        n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return; var str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
        return str;
    }
    return inWords(amount);
}

const sendPDF = async (visitorDetails, donationDetails) => {
    try {
        let cont;
        let wordAmount = amountConversion(donationDetails.amount);
        let dt = new Date();
        let misc = {
            address: "Not Applicable",
            amountWords: wordAmount,
            paymentMode: "Online",
            memberCode: "Not Applicable",
            date: dt.toISOString().slice(0, 10)
        }

        fs.readFile("views//pdfTemplates/donationSlip.ejs", "utf-8", async (err, content) => {
            if (err) {
                console.log('error in reading ejs file', err);
            }
            cont = ejs.render(content, {
                visitor: visitorDetails,
                donation: donationDetails,
                misc: misc
            });
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(cont);

            await page.pdf({
                path: `public/donations/${donationDetails.donationID}.pdf`,
                format: "a4",
            });
            await browser.close();
            let filePath = `public/donations/${donationDetails.donationID}.pdf`;
            await sendFile(visitorDetails.email, filePath, `${donationDetails.donationID}.pdf`);
        });


    } catch (err) {
        console.log('error in sending pdf file ', err);
    }
};


module.exports = { sendPDF };