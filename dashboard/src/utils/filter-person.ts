import type { PersonPopulated } from "../types/person";
import type { UUIDV4 } from "../types/uuid";
import type { PeriodISODate } from "../types/date";

export function filterPersonByAssignedTeam(
  viewAllOrganisationData: boolean,
  selectedTeamsObjectWithOwnPeriod: Record<UUIDV4, PeriodISODate>,
  assignedTeams: PersonPopulated["assignedTeams"],
  forTeamFiltering: PersonPopulated["forTeamFiltering"]
) {
  if (viewAllOrganisationData) return true;
  if (!assignedTeams?.length) return true; // no assignedTeam is currently forbidden, but hasn't always been the case

  // when is the person included ?
  // 5 cases:
  // 1. assigned team period is accross the start date of the selected period
  // 2. assigned team period is accross the end date of the selected period
  // 3. assigned team period is included in the selected period
  // 4. selected period is included in the assigned team period
  // 5. period doesn't matter (isoStartDate === null and isoEndDate === null) and assigned team has been included in history

  // when is the person not included ?
  // 1. assigned team period is before the start date of the selected period
  // 2. assigned team period is after the end date of the selected period
  // 3. no assigned team period is found in the selected period
  // 4. period doesn't matter (isoStartDate === null and isoEndDate === null) and assigned team has NOT been included in history

  for (const [teamId, { isoEndDate, isoStartDate }] of Object.entries(selectedTeamsObjectWithOwnPeriod)) {
    // GOOD TO KNOW: forTeamFiltering is sorted by date from the oldest to the newest
    // first we need to handle the case of isoStartDate === null and isoEndDate === null (no period)
    if (isoStartDate === null && isoEndDate === null) {
      // this is the case "Toutes les données", where the period doesn't matter, only the assigned team matters
      for (const teamChange of forTeamFiltering) {
        if (teamChange.assignedTeams.includes(teamId)) {
          return true;
        }
      }
      return false;
    }
    // now we can handle the other cases where the period matters (isoStartDate !== null and isoEndDate !== null)
    let mightBeIncluded = false;
    for (const teamChange of forTeamFiltering) {
      // if one of the date is included in the period, we can return true
      if (!teamChange.assignedTeams.includes(teamId)) {
        // for case 1. we need to check if the assigned team was accross the start date of the period
        if (teamChange.date >= isoStartDate) {
          if (mightBeIncluded) {
            // check `mightBeIncluded = true;` below
            // it means the assigned team was accross the start date of the period
            return true;
          }
        }
        mightBeIncluded = false;
        continue;
      }
      if (teamChange.date <= isoStartDate) {
        mightBeIncluded = true; // because assigned team period might be accross the start date of the selected period
        // will be included if no other teamChange is found in the period
        // example: person creation is 2022-01-01 and never changed team, ioStartDate is 2022-09-23 -> included
      }
      if (teamChange.date >= isoStartDate && teamChange.date <= isoEndDate) {
        return true;
      }
    }
    if (mightBeIncluded) {
      return true;
    }
  }
  return false;
}
