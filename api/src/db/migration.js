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

// const currentTeam = get(currentTeamState);
// const comments = get(commentsState);
// const persons = get(personsState);
// return comments
//   .filter((c) => c.team === currentTeam._id)
//   .filter((c) => getIsDayWithinHoursOffsetOfDay(c.createdAt, date, currentTeam?.nightSession ? 12 : 0))
//   .filter((c) => !!c.comment.includes('Passage enregistré'))
//   .map((passage) => {
//     const commentPopulated = { ...passage };
//     if (passage.person) {
//       commentPopulated.person = persons.find((p) => p._id === passage?.person);
//       commentPopulated.type = 'person';
//     }
//     return commentPopulated;
//   });

// here you can write any data migration, not schema migrations
(async () => {
  const organisations = await Organisation.findAll({ where: { receptionEnabled: true } });
  const commentedPassages = await Comment.findAll({ where: { comment: "Passage enregistré" } });
  const teams = await Team.findAll();
  const reports = await Report.findAll();
  console.log(commentedPassages.length, organisations.length, teams.length, reports.length);
  // for (const comment of commentedPassages) {
  // if (!comment.team) {
  //   console.log("NO COMMENT TEAM", comment._id);
  //   continue;
  // }
  // const team = teams.find((t) => t._id === comment.team);
  // if (!team) {
  //   console.log("NO TEAM", comment._id, comment.team);
  //   continue;
  // }
  // const report = reports
  //   .filter((r) => r.team === comment.team)
  //   .find((r) => getIsDayWithinHoursOffsetOfDay(comment.createdAt, r.date, team?.nightSession ? 12 : 0));
  // if (!report) {
  //   console.log("NO REPORT", comment._id, team.nightSession);
  // }
  // grab the report
  // }

  // check double reports
  let doubles = 0;
  reports.reduce((dates, report) => {
    if (!dates[report.date]) dates[report.date] = {};
    if (!dates[report.date][report.team]) {
      dates[report.date][report.team] = report._id;
    } else {
      console.log("DOUBLE", report._id, dates[report.date][report.team], report.team, report.date);
      doubles++;
    }
    return dates;
  }, {});
  console.log({ doubles });
})();
