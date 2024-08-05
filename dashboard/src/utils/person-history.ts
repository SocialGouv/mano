import { dayjsInstance } from "../services/date";
import type { PersonInstance, AssignedTeamsPeriods } from "../types/person";
import type { TeamInstance } from "../types/team";

type HistoryEntry<T> = {
  date: string;
  data: T;
};

export const cleanHistory = <T>(history: Array<HistoryEntry<T>> = []): Array<HistoryEntry<T>> => {
  const alreadyExisting = {};
  return history.filter((h) => {
    const stringifiedEntry = JSON.stringify(h.data);
    // FIX: there was a bug in history at some point, where the whole person was saved in the history
    // below it removes removes those entries
    if (stringifiedEntry.includes("encryptedEntityKey")) return false;
    // FIX: there was a bug in history at some point, where person's history was saved in the medicalFile history
    // below it removes those duplicated entries
    if (alreadyExisting[`${h.date}-${stringifiedEntry}`]) return false;
    alreadyExisting[`${h.date}-${stringifiedEntry}`] = true;
    return true;
  });
};

export function extractInfosFromHistory(
  person: PersonInstance,
  allTeamIds: Array<TeamInstance["_id"]>
): {
  interactions: Array<Date>;
  assignedTeamsPeriods: AssignedTeamsPeriods;
} {
  const interactions = [person.followedSince || person.createdAt];
  // assignedTeamsPeriods
  // final format example, after looping the whole history: { teamIdA: [{ endDate: startDate: }, { endDate: startDate: }] }
  // current format: { teamIdA: [{ endDate: now,  startDate: undefined }] }
  const assignedTeamsPeriods: AssignedTeamsPeriods = (person.assignedTeams || []).reduce(
    (acc, teamId) => {
      acc[teamId] = [{ isoEndDate: dayjsInstance().startOf("day").toISOString(), isoStartDate: undefined }];
      return acc;
    },
    {
      all: [
        {
          isoEndDate: dayjsInstance().startOf("day").toISOString(),
          isoStartDate: dayjsInstance(person.followedSince || person.createdAt).toISOString(),
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
      if (historyEntry.data.assignedTeams) {
        const currentTeams = (historyEntry.data.assignedTeams.newValue || allTeamIds) as Array<TeamInstance["_id"]>;
        const previousTeams = (historyEntry.data.assignedTeams.oldValue || allTeamIds) as Array<TeamInstance["_id"]>;
        const newlyAddedTeams = currentTeams.filter((t) => !previousTeams.includes(t));
        const removedTeams = previousTeams.filter((t) => !currentTeams.includes(t));
        for (const teamId of newlyAddedTeams) {
          assignedTeamsPeriods[teamId] = (assignedTeamsPeriods[teamId] || []).map((period) => {
            if (period.isoStartDate) return period;
            return {
              ...period,
              isoStartDate: dayjsInstance(historyEntry.date).toISOString(),
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
  }
  for (const teamId of oldestTeams) {
    if (!assignedTeamsPeriods[teamId]) assignedTeamsPeriods[teamId] = [];
    assignedTeamsPeriods[teamId].push({ isoStartDate: dayjsInstance(person.followedSince || person.createdAt).toISOString(), isoEndDate: null });
  }
  return {
    interactions,
    assignedTeamsPeriods,
  };
}
