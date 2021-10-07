const fetch = require("node-fetch");
const { capture } = require("../sentry");
const { X_TIPIMAIL_APIUSER, X_TIPIMAIL_APIKEY } = require("../config");

const sendEmail = async (address, subject, text) => {
  if (process.env.NODE_ENV === "development") {
    address = process.env.EMAIL_DEV || "arnaud@ambroselli.io";
  }
  return fetch("https://api.tipimail.com/v1/messages/send", {
    method: "POST",
    headers: {
      "X-Tipimail-ApiUser": X_TIPIMAIL_APIUSER,
      "X-Tipimail-ApiKey": X_TIPIMAIL_APIKEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey: X_TIPIMAIL_APIKEY,
      to: [
        {
          address,
        },
      ],
      msg: {
        from: {
          address: "admin@manoapp.fr",
          personalName: "App Mano",
        },
        subject,
        text,
      },
    }),
  })
    .then((res) => res.json())
    .catch((err) => capture(err, { extra: { message: "error sending address", address, subject, text } }));
};

module.exports = {
  sendEmail,
};
