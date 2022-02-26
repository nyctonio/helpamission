const nodemailer = require('nodemailer');
require('dotenv').config();

module.exports.sendFile = async (customerEmail, path, fileName) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        auth: {
            user: process.env.mail_user,
            pass: process.env.mail_pass
        }
    });


    let mailToUser = {
        from: 'demo@gmail.com',
        to: customerEmail,

        attachments: [
            {
                filename: fileName,
                path: path
            }
        ]
    }


    transporter.sendMail(mailToUser, (err, info) => {
        if (err) {
            console.log('error in sending mail ', err);
            return;
        }
        console.log('Message sent ', info);
    })
}