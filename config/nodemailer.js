const nodemailer = require("nodemailer");
require("dotenv").config();
const ejs = require("ejs");
const path = require("path");

let swiggy = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "process.env.mail_user",
    pass: "process.user.mail_pass",
  },
});

let renderTemplate = (data, relativePath) => {
  try {
    let mailHTML;
    let templateData = {
      data,
    };
    // console.log('template data is ', templateData);
    // console.log('in render template function');
    ejs.renderFile(
      path.join(__dirname, `../views/pdfTemplates/content/${relativePath}`),
      templateData,
      function (err, template) {
        if (err) {
          console.log("error in rendering the template", err);
          return;
        }
        mailHTML = template;
      }
    );
    return mailHTML;
  } catch (err) {
    console.log("error in render html function ", err);
  }
};

module.exports = {
  swiggy,
  renderTemplate,
};
