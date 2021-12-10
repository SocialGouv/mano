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

// this function is copy/pasted from dashboard
const getIsDayWithinHoursOffsetOfDay = (dayToTest, referenceDay, offsetHours) => {
  if (!dayToTest) return false;
  referenceDay = new Date(referenceDay);
  referenceDay.setHours(0, 0, 0, 0);
  const startDate = new Date(referenceDay);
  startDate.setHours(referenceDay.getHours() + offsetHours);
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + 24);

  dayToTest = new Date(dayToTest).toISOString();

  return dayToTest > startDate.toISOString() && dayToTest <= endDate.toISOString();
};

// this migration is to be called ONCE ONLY, otherwise there line 54 will be called many times

(async () => {
  const commentedPassages = await Comment.findAll({ where: { comment: "Passage enregistré" } });
  const teams = await Team.findAll();
  const reports = await Report.findAll();
  for (const comment of commentedPassages) {
    if (!comment.team) {
      console.log("NO COMMENT TEAM", comment._id);
      continue;
    }
    const team = teams.find((t) => t._id === comment.team);
    if (!team) {
      console.log("NO TEAM", comment._id, comment.team);
      continue;
    }
    const report = reports
      .filter((r) => r.team === comment.team)
      .find((r) => getIsDayWithinHoursOffsetOfDay(comment.createdAt, r.date, team?.nightSession ? 12 : 0));
    if (!!report && !!report.passages && report.passages > 1) {
      report.set({ passages: report.passages - 1 });
      await report.save();
    }
  }
  capture("DONE PASSAGES MIGRATION");
})();
