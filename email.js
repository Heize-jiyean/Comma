// email.js

const nodemailer = require("nodemailer");

const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "team.ive.comma@gmail.com",
        pass: "kwtk unkh vwyg mdce",
    },
});

module.exports = smtpTransport;