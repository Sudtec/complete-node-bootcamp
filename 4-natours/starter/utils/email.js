const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1) Create the transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // If Using Gmail activate "less secure App options"

  //2) Definne the email options
  const mailOptions = {
    from: 'Dev Sud <Devsud@gmail.com>', // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // plain text body
    // html: "<b>Hello world?</b>", // html body
  };
  //3) Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail; 