const AWS = require("aws-sdk");

class Mail {
  constructor() {
    this.source_email = "contact@mail.com";
    this.source_name = "contact";
  }

  init(source_email, source_name) {
    this.source_email = source_email;
    this.source_name = source_name;
  }

  sendEmail(to, subject, body) {
    return new Promise(async (resolve, reject) => {
      try {
        AWS.config.update({ region: "eu-west-1" });

        // Create sendEmail params
        const params = {
          Destination: { ToAddresses: [to] },
          Message: {
            Body: { Text: { Charset: "UTF-8", Data: body }, Html: { Charset: "UTF-8", Data: body } },
            Subject: { Charset: "UTF-8", Data: subject || "" },
          },
          Source: `${this.source_name} <${this.source_email}>`,
        };
        // Create the promise and SES service object
        const sendPromise = new AWS.SES({ apiVersion: "2010-12-01" }).sendEmail(params).promise();
        const data = await sendPromise;
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  }
}

const e = new Mail();
module.exports = e;
