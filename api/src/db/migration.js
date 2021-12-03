const { Op } = require("sequelize");
const Organisation = require("../models/organisation");
const Team = require("../models/team");
const Person = require("../models/person");
const User = require("../models/user");
const Place = require("../models/place");
const RelPersonPlace = require("../models/relPersonPlace");
const RelUserTeam = require("../models/relUserTeam");
const Structure = require("../models/structure");
const Action = require("../models/action");
const Comment = require("../models/comment");
const Territory = require("../models/territory");
const TerritoryObservation = require("../models/territoryObservation");
const RelPersonTeam = require("../models/relPersonTeam");
const Report = require("../models/report");
const { capture } = require("../sentry");

// here you can write any data migration, not schema migrations
(async () => {
  // check double reports
  const reports = await Report.findAll();
  let doubles = 0;
  const allReports = reports.reduce((dates, report) => {
    if (!dates[`${report.date}-${report.team}`]) {
      dates[`${report.date}-${report.team}`] = [report];
    } else {
      dates[`${report.date}-${report.team}`].push(report);
      doubles++;
    }
    return dates;
  }, {});
  const doubleReports = Object.keys(allReports)
    .filter((key) => allReports[key].length > 1)
    .map((key) => [key, allReports[key]]);

  for (const [key, reports] of doubleReports) {
    const mainReport = reports.find((r) => !!r.description || !!r.services || !!r.passages || !!(r.collaborations && r.collaborations.length));
    if (mainReport) {
      for (const report of reports.filter((r) => r._id !== mainReport._id)) {
        await report.destroy();
      }
    } else {
      for (const report of reports.filter((r, i) => i > 0)) {
        await report.destroy();
      }
    }
  }
  capture("MIGRATION REPORTS DONE");
})();
