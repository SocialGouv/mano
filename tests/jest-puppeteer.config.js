require("dotenv").config({ path: "./.env" });

if (!process.env.PGHOST || !process.env.PGDATABASE || !process.env.PGPORT) {
  console.log("PGHOST, PGDATABASE, PGPORT env variables not set");
  process.exit(1);
}

module.exports = {
  launch: {
    headless: process.env.CI === "true",
  },
  server: [
    {
      command: "npx serve --single -l 8090 ../dashboard/build",
      port: 8090,
      launchTimeout: 30000,
      debug: true,
    },
    {
      command: `PORT=8091 PGHOST=${process.env.PGHOST || '""'} PGDATABASE=${
        process.env.PGDATABASE || '""'
      } PGPORT=${process.env.PGPORT || '""'} PGUSER=${
        process.env.PGUSER || '""'
      } PGPASSWORD=${
        process.env.PGPASSWORD || '""'
      } yarn --cwd ../api start:test`,
      port: 8091,
      launchTimeout: 30000,
      debug: true,
    },
  ],
};
