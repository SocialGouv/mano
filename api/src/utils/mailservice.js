const fetch = require("node-fetch");
const { capture } = require("../sentry");
const { X_TIPIMAIL_APIUSER, X_TIPIMAIL_APIKEY } = require("../config");

const sendEmail = async (address, subject, text) => {
  if (process.env.NODE_ENV === "test") return;
  if (process.env.NODE_ENV === "development") {
    address = process.env.EMAIL_DEV || "arnaud@ambroselli.io";
  }
  const emailSentResponse = await fetch("https://api.tipimail.com/v1/messages/send", {
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
  });
  if (!emailSentResponse.ok) {
    capture(new Error("Email not sent"), { address, subject, text, response: emailSentResponse });
  }
  return emailSentResponse;
};

module.exports = {
  sendEmail,
};
