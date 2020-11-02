require("dotenv").config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const logger = require("morgan");
const errors = require("./errors");
const cookieParser = require("cookie-parser");
const { PORT } = require("./config");
// Put together a schema
const app = express();
app.use(logger("dev"));

// Pre middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(helmet());
app.use(cors({ credentials: true, origin: ["http://localhost:8083"] }));
app.use(cookieParser());

// Routes
require("./passport")(app);

app.use("/user", require("./controllers/user"));
app.use("/person", require("./controllers/person"));
app.use("/action", require("./controllers/action"));
app.use("/structure", require("./controllers/structure"));
app.use("/comment", require("./controllers/comment"));
app.use("/place", require("./controllers/place"));
app.use("/team", require("./controllers/team"));
app.use("/organisation", require("./controllers/organisation"));

const now = new Date().toISOString();
app.get("/", async (req, res) => {
  res.send(`Hello World on port ${PORT} at ${now} v1`);
});

app.use(errors.sendError);

// Start the server
app.listen(PORT, () => console.log(`RUN ON PORT ${PORT}`));
