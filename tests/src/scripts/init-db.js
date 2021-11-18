const pg = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.PGBASEURL || !process.env.PGDATABASE) {
  console.log("PGBASEURL and PGDATABASE env variables not set");
  process.exit(1);
}

async function createDb() {
  const client = new pg.Client({
    connectionString: `${process.env.PGBASEURL}/postgres`,
  });
  await client.connect();
  await client.query("DROP DATABASE IF EXISTS manotest");
  await client.query("CREATE DATABASE manotest");
  await client.end();
}

async function createManoSchema() {
  const client = new pg.Client({
    connectionString: `${process.env.PGBASEURL}/${process.env.PGDATABASE}`,
  });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS mano`);
  await client.end();
}

async function importDB() {
  const client = new pg.Client({
    connectionString: `${process.env.PGBASEURL}/${process.env.PGDATABASE}`,
  });
  await client.connect();
  const sql = fs.readFileSync(path.resolve(__dirname, "db.sql")).toString();
  await client.query(sql);
  await client.end();
}

(async () => {
  try {
    await createDb();
    await createManoSchema();
    await importDB();
  } catch (err) {
    console.error(err);
  }
})();
