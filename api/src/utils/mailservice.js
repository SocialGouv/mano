const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail-sesan.grita.fr",
  port: 25,
  // secure: true,
});

const sendEmail = async (address, subject, text, html) => {
  if (process.env.NODE_ENV === "test") return;
  if (process.env.NODE_ENV === "development") {
    address = process.env.EMAIL_DEV || "arnaud@ambroselli.io";
  }

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: `"App Mano" <no-reply@mano.sesan.fr>`,
    to: address,
    subject, // Subject line
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
  });
  console.log("Message sent: %s", info.messageId);
  return info;
};

module.exports = {
  sendEmail,
};
