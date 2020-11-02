const fs = require("fs");
const path = require("path");

function sendGenericEmail(to, subject, context) {
  const { title, message, button_title, cta, logo, sender, reply_to } = context;
  const htmlEmail = fs.readFileSync(path.resolve(__dirname, "./generic.html")).toString();
  const htmlEmailWithRealValue = htmlEmail
    .replace(/{{title}}/g, title)
    .replace(/{{message}}/g, message.replace(/\n/g, "<br/>"))
    .replace(/{{button_title}}/g, button_title)
    .replace(/{{cta}}/g, cta);

  return htmlEmailWithRealValue;
}

module.exports = { sendGenericEmail };
