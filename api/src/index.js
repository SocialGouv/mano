require("dotenv").config({ path: "./.env" });
const fs = require("fs");
const path = require("path");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const { PORT, DEPLOY_KEY } = require("./config");
const errors = require("./errors");

const versionCheck = require("./middleware/versionCheck");
const { SentryInit, capture } = require("./sentry");
const Sentry = require("@sentry/node");

require("./db/sequelize");

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
  app.use(cors({ credentials: true, origin: [/fabrique\.social\.gouv\.fr$/, /mano\.localhost$/, /sesan\.fr$/] }));
} else {
  app.use(cors({ credentials: true, origin: ["http://localhost:4145", "http://localhost:8083", "http://localhost:8090", "http://localhost:3000"] }));
}

const now = new Date();
// kube probe
app.get("/healthz", async (req, res) => {
  fs.writeFileSync("/deploy/test.txt", "deploy", {
    flag: "w",
  });
  res.send(`Hello World`);
});

app.get("/sentry-check", async (req, res) => {
  capture("sentry-check");
  res.send(`Sentry checked!`);
});

app.get("/", async (req, res) => {
  res.send(`Hello World at ${now.toISOString()}`);
});

app.set("json replacer", (k, v) => (v === null ? undefined : v));

// Pre middleware
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const limitedSize = req.path.startsWith("/encrypt") ? "350mb" : "50mb";
  express.json({ limit: limitedSize })(req, res, next);
});
app.use(helmet());
app.use(cookieParser());

// Route for deployment
app.post("/api/deploy", (req, res) => {
  // check "deploy-key" body parameter and compare it with the one in the .env file
  if (!req.body["deploy-key"] || req.body["deploy-key"] !== DEPLOY_KEY) {
    res.status(401).send("Unauthorized");
    return;
  }
  fs.writeFileSync("/deploy/deploy-signal.txt", "deploy", {
    flag: "w",
  });
  res.send("Déploiement déclenché");
});

// Routes
app.use(versionCheck);
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
// Temporary.
app.use("/person-backup", require("./controllers/personBackup"));

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.use(errors.sendError);

// Start the server
app.listen(PORT, () => console.log(`RUN ON PORT ${PORT}`));
