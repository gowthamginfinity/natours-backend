// const nodemailer = require('nodemailer');

// module.exports = class Email {
//   constructor(user, url) {
//     this.to = user.email;
//     this.firstName = user.name.split(' ')[0];
//     this.url = url;
//     this.from = 'Gowtham <molu.gp@gmail.com';
//   }
// };

// const sendEmail = async (options) => {
//   // 1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST, // this
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
//   // 2) Define the email options

//   const mailOptions = {
//     from: 'Gowtham <hello@gowtham.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html: options.html,
//   };
//   // 3) Actually send the email

//   await transporter.sendMail(mailOptions);
// };

// module.exports = { sendEmail };

const nodemailer = require('nodemailer');
const pug = require('pug');
// 🚨 LATEST 2026 FIX: Correct import for html-to-text (fromString is deprecated)
const { convert } = require('html-to-text');
const sgMail = require('@sendgrid/mail');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Gowtham <${process.env.EMAIL_FROM}>`;
  }

  // 1) Create specific Transporter based on Environment (Mailtrap for Dev, SendGrid/Resend for Prod)
  newDevTransport() {
    // Development Environment: Mailtrap (Safe Sandbox)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // 2) Core Send Engine (Renders Pug HTML & Dispatches Email)
  async send(template, subject) {
    // A) Render HTML template from Pug file
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // B) Define Email Options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // 🚨 LATEST 2026 FIX: Modern convert() method replaces deprecated fromString()
      text: convert(html, { wordwrap: 130 }),
    };

    if (process.env.NODE_ENV === 'production') {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send(mailOptions);
    } else {
      await this.newDevTransport().sendMail(mailOptions);
    }
  }

  // 3) Specialized Shortcut Methods
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
};
