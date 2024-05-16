const { Op } = require("sequelize");
const { UserLog } = require("../db/sequelize");
const { capture } = require("../sentry");

async function cleanUserLogsAfter6Months() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  UserLog.destroy({ where: { createdAt: { [Op.lt]: sixMonthsAgo } } });
}

cleanUserLogsAfter6Months()
  .then(() => {
    console.log("User logs cleaned after 6 months");
  })
  .catch((e) => {
    capture("Error cleaning user logs after 6 months", { extra: JSON.stringify(e.message || e) });
    console.error(e);
  });
