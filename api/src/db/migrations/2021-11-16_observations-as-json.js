const { QueryTypes } = require("sequelize");
const sequelize = require("../sequelize");

(async () => {
  try {
    const rows = await sequelize.query(`select "customFieldsObs", _id from "mano"."Organisation" where "customFieldsObs" is not null`, {
      type: QueryTypes.SELECT,
    });

    // For each rows, check if the customFieldsObs is a JSON string
    // If it is, convert it to a JSON object
    // If it is not, do nothing
    for (const row of rows) {
      if (typeof row.customFieldsObs === "string") {
        await sequelize.query(`update "mano"."Organisation" set "customFieldsObs" = ? where _id = ?`, {
          replacements: [row.customFieldsObs, row._id],
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
})();
