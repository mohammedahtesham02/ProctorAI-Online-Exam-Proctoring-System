const nodemailer = require('nodemailer');

// Configure with your email provider's SMTP details in .env
// For Gmail: use an "App Password", not your regular password
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  family: 4, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: `"Exam Proctoring System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  return info;
};

module.exports = sendEmail;
