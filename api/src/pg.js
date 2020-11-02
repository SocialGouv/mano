const { Pool } = require("pg");
const { PG_CONNECTION_STRING } = require("./config");

const pool = new Pool({ connectionString: `${PG_CONNECTION_STRING}` });

pool.on("error", (err, client) => {
  console.error("error cought on idle client", err);
  process.exit(-1);
});

pool.connect((err, client, done) => {
  if (err) {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
    return;
  }
  console.log("pg connected");
});

module.exports = {
  pg: pool,
  prepareUpdateQuery: (tableName, updateObj, condition, debug = false) => {
    const query = `UPDATE ${tableName} SET
      ${Object.keys(updateObj)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(",\n")}
      ${condition}
    `;
    if (debug) console.log(query);
    return query;
  },
  prepareConditionQuery: (fields = []) => {
    if (!fields.length) return "";
    let merged = fields.join("\nAND ");
    return merged.split("?").reduce((previousValue, currentValue, index) => {
      if (index === 0) return currentValue;
      return `${previousValue}$${index}${currentValue}`;
    }, "");
  },
};
