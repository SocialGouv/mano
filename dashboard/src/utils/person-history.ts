import { dayjsInstance } from "../services/date";
import type { PersonInstance, AssignedTeamsPeriods, PersonHistoryEntry, FieldChangeData } from "../types/person";
import type { TeamInstance } from "../types/team";
import { forbiddenPersonFieldsInHistory } from "../recoil/persons";

export const cleanHistory = (history: Array<PersonHistoryEntry> = []): Array<PersonHistoryEntry> => {
  const alreadyExisting = {};
  const newHistory = [];
  for (const h of history) {
    const stringifiedEntry = JSON.stringify(h.data);
    // FIX: there was a bug in history at some point, where the whole person was saved in the history
    // below it removes removes those entries
    if (stringifiedEntry.includes("encryptedEntityKey")) continue;
    // FIX: there was a bug in history at some point, where person's history was saved in the medicalFile history
    // below it removes those duplicated entries
    if (alreadyExisting[`${h.date}-${stringifiedEntry}`]) continue;
    alreadyExisting[`${h.date}-${stringifiedEntry}`] = true;

    const newEntry = {
      ...h,
      data: {},
    };

    for (const fieldName of Object.keys(h.data)) {
      if (fieldName === "merge") {
        newEntry.data[fieldName] = { ...h.data[fieldName] };
        continue;
      }
      if (fieldName === "outOfTeamsInformations") {
        newEntry.data[fieldName] = [...h.data[fieldName]];
        continue;
      }
      if (forbiddenPersonFieldsInHistory.includes(fieldName)) continue; // fix a bug where still some technical fields were saved in the history
      if (!h.data[fieldName]?.oldValue && !h.data[fieldName]?.newValue) {
        // fix a behavior where in the app we were saving defaults values
        continue;
      }
      if (Array.isArray(h.data[fieldName]?.newValue) && !h.data[fieldName]?.oldValue?.length && !h.data[fieldName]?.newValue?.length) {
        // fix a behavior where in the app we were saving defaults values
        continue;
      }
      newEntry.data[fieldName] = { ...h.data[fieldName] };
    }
    if (Object.keys(newEntry.data).length === 0) continue;
    newHistory.push(newEntry);
  }
  return newHistory;
};

export function extractInfosFromHistory(person: PersonInstance): {
  interactions: Array<Date>;
  assignedTeamsPeriods: AssignedTeamsPeriods;
} {
  const interactions = [person.followedSince || person.createdAt];
  // assignedTeamsPeriods
  // final format example, after looping the whole history: { teamIdA: [{ endDate: startDate: }, { endDate: startDate: }] }
  // current format: { teamIdA: [{ endDate: now,  startDate: undefined }] }
  const assignedTeamsPeriods: AssignedTeamsPeriods = (person.assignedTeams || []).reduce(
    (acc, teamId) => {
      acc[teamId] = [
        {
          isoStartDate: null,
          isoEndDate: dayjsInstance().startOf("day").toISOString(),
        },
      ];
      return acc;
    },
    {
      all: [
        {
          isoStartDate: dayjsInstance(person.followedSince || person.createdAt).toISOString(),
          isoEndDate: dayjsInstance().startOf("day").toISOString(),
        },
      ],
    }
  );
  let oldestTeams = person.assignedTeams || [];

  if (person.history?.length) {
    // history is sorted by date from the oldest to the newest (ascending order)
    // we want to loop it from the newest to the oldest (descending order)
    for (let i = person.history.length - 1; i >= 0; i--) {
      const historyEntry = person.history[i];
      interactions.push(historyEntry.date);
      const data = historyEntry.data as FieldChangeData;
      if (!data.assignedTeams) continue;
      const currentTeams = (data.assignedTeams.newValue || []) as Array<TeamInstance["_id"]>;
      const previousTeams = (data.assignedTeams.oldValue || []) as Array<TeamInstance["_id"]>;
      const newlyAddedTeams = currentTeams.filter((t) => !previousTeams.includes(t));
      const removedTeams = previousTeams.filter((t) => !currentTeams.includes(t));
      for (const teamId of newlyAddedTeams) {
        assignedTeamsPeriods[teamId] = (assignedTeamsPeriods[teamId] || []).map((period) => {
          if (period.isoStartDate) return period;
          return {
            isoStartDate: dayjsInstance(historyEntry.date).toISOString(),
            isoEndDate: period.isoEndDate,
          };
        });
      }
      for (const teamId of removedTeams) {
        if (!assignedTeamsPeriods[teamId]) assignedTeamsPeriods[teamId] = [];
        assignedTeamsPeriods[teamId].unshift({
          isoStartDate: null,
          isoEndDate: dayjsInstance(historyEntry.date).toISOString(),
        });
      }
      oldestTeams = previousTeams;
    }
  }
  for (const teamId of oldestTeams) {
    if (!assignedTeamsPeriods[teamId]) assignedTeamsPeriods[teamId] = [];
    assignedTeamsPeriods[teamId] = (assignedTeamsPeriods[teamId] || []).map((period) => {
      if (period.isoStartDate) return period;
      return {
        isoStartDate: dayjsInstance(person.followedSince || person.createdAt).toISOString(),
        isoEndDate: period.isoEndDate,
      };
    });
  }
  return {
    interactions,
    assignedTeamsPeriods,
  };
}
