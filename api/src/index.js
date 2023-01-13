require("dotenv").config({ path: "./.env" });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const { PORT } = require("./config");
const errors = require("./errors");

const versionCheck = require("./middleware/versionCheck");
const { SentryInit } = require("./sentry");
const Sentry = require("@sentry/node");

require("./db/sequelize");
require("./db/relation");

// Put together a schema
const app = express();
if (process.env.NODE_ENV === "development") {
  app.use(logger("dev"));
}

SentryInit(app);
// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

if (process.env.NODE_ENV === "production") {
  app.use(cors({ credentials: true, origin: /fabrique\.social\.gouv\.fr$/ }));
} else {
  app.use(cors({ credentials: true, origin: ["http://localhost:4145", "http://localhost:8083", "http://localhost:8090", "http://localhost:3000"] }));
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

// Routes

require("./passport")(app);

app.use("/", require("./controllers/utils"));
app.use("/user", require("./controllers/user"));
app.use("/person", require("./controllers/person"));
app.use("/action", require("./controllers/action"));
app.use("/structure", require("./controllers/structure"));
app.use("/comment", require("./controllers/comment"));
app.use("/passage", require("./controllers/passage"));
app.use("/rencontre", require("./controllers/rencontre"));
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
app.use("/custom-field", require("./controllers/custom-field"));
app.use("/migration", require("./controllers/migration"));
app.use("/merge", require("./controllers/merge"));
app.use("/consultation", require("./controllers/consultation"));
app.use("/treatment", require("./controllers/treatment"));
app.use("/group", require("./controllers/group"));
app.use("/medical-file", require("./controllers/medicalFile"));
// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.use(errors.sendError);

// Start the server
app.listen(PORT, () => console.log(`RUN ON PORT ${PORT}`));
