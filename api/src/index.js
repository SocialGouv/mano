require("dotenv").config({ path: "./.env" });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const { PORT, VERSION } = require("./config");
const errors = require("./errors");

const versionCheck = require("./middleware/versionCheck");

require("./db/sequelize");
require("./db/relation");

// Put together a schema
const app = express();
if (process.env.NODE_ENV === "development") {
  app.use(logger("dev"));
}

if (process.env.NODE_ENV === "production") {
  // FIXME: just to trigger stuff
  console.log("to delete again");
}

if (process.env.NODE_ENV === "production") {
  app.use(cors({ credentials: true, origin: /fabrique\.social\.gouv\.fr$/ }));
} else {
  app.use(cors({ credentials: true, origin: ["http://localhost:4145", "http://localhost:8083", "http://localhost:8090"] }));
}

const now = new Date();
// kube probe
app.get("/healthz", async (req, res) => {
  res.send(`Hello World`);
});

app.get("/", async (req, res) => {
  res.send(`Hello World at ${now.toISOString()}`);
});

app.set("json replacer", (k, v) => (v === null ? undefined : v));
app.use(versionCheck);

// Pre middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(helmet());
app.use(cookieParser());

// Add header with API version to compare with client.
app.use((_req, res, next) => {
  res.header("X-API-VERSION", VERSION);
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
  res.header("Access-Control-Expose-Headers", "X-API-VERSION");
  next();
});

// Routes

require("./passport")(app);

app.use("/", require("./controllers/utils"));
app.use("/user", require("./controllers/user"));
app.use("/person", require("./controllers/person"));
app.use("/action", require("./controllers/action"));
app.use("/structure", require("./controllers/structure"));
app.use("/comment", require("./controllers/comment"));
app.use("/passage", require("./controllers/passage"));
app.use("/report", require("./controllers/report"));
app.use("/place", require("./controllers/place"));
app.use("/relPersonPlace", require("./controllers/relPersonPlace"));
app.use("/territory-observation", require("./controllers/territoryObservation"));
app.use("/territory", require("./controllers/territory"));
app.use("/team", require("./controllers/team"));
app.use("/organisation", require("./controllers/organisation"));
app.use("/public", require("./controllers/public"));
app.use("/encrypt", require("./controllers/encrypt"));
app.use("/category", require("./controllers/category"));
app.use("/service", require("./controllers/service"));
app.use("/migration", require("./controllers/migration"));
app.use("/consultation", require("./controllers/consultation"));
app.use("/treatment", require("./controllers/treatment"));
app.use("/medical-file", require("./controllers/medicalFile"));

app.use(errors.sendError);

// Start the server
app.listen(PORT, () => console.log(`RUN ON PORT ${PORT}`));
