const nodemailer = require('nodemailer');
require('dotenv').config();

const { META_PASSWORD } = process.env;

const nodeMailerConfig = {
  host: 'smtp.meta.ua',
  port: 465,
  secure: true,
  auth: {
    user: 'lunev.i@meta.ua',
    pass: META_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(nodeMailerConfig);

const sendEmail = async data => {
  try {
    const email = { ...data, from: 'lunev.i@meta.ua' };
    await transporter.sendMail(email);
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendEmail;
