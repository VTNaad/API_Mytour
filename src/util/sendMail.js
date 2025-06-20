const nodemailer = require("nodemailer");
const sendMail = async (action, { email, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: '"Mytour" <no-reply@tourvn.gmail.com>', // sender address
      to: email, // list of receivers
      subject: action, // Subject line
      text: "Hello world", // plain text body
      html: html, // html body
    });
    return info;
  } catch (error) {
    throw new Error(error);
  }
};

const sendMailRegister = async ({ email, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: '"Speaking English" <no-reply@speakingen.gmail.com>', // sender address
      to: email, // list of receivers
      subject: "Create Account", // Subject line
      text: "Hello world", // plain text body
      html: html, // html body
    });
    return info;
  } catch (error) {
    throw new Error(error);
  }
};
const sendMailEditProfile = async ({ email, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: '"Speaking English" <no-reply@speakingen.gmail.com>', // sender address
      to: email, // list of receivers
      subject: "Edit Account", // Subject line
      text: "Hello world", // plain text body
      html: html, // html body
    });
    return info;
  } catch (error) {
    throw new Error(error);
  }
};

const sendMailReviewHotel = async ({ email, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: '"Mytour" <no-reply@tour.gmail.com>', // sender address
      to: email, // list of receivers
      subject: "Review Hotel Notification", // Subject line
      text: "Hello world", // plain text body
      html: html, // html body
    });
    return info;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  sendMail,
  sendMailRegister,
  sendMailEditProfile,
  sendMailReviewHotel,
};
