import type { PersonPopulated } from "../types/person";
import type { UUIDV4 } from "../types/uuid";
import type { PeriodISODate } from "../types/date";

interface GetPersonPeriodsArguments {
  viewAllOrganisationData: boolean;
  isoStartDate: string;
  isoEndDate: string;
  selectedTeamsObjectWithOwnPeriod: Record<UUIDV4, PeriodISODate>;
  assignedTeamsPeriods: PersonPopulated["assignedTeamsPeriods"];
}

export function mergedPersonAssignedTeamPeriodsWithQueryPeriod({
  viewAllOrganisationData,
  isoStartDate,
  isoEndDate,
  selectedTeamsObjectWithOwnPeriod,
  assignedTeamsPeriods,
}: GetPersonPeriodsArguments): Array<{ isoStartDate: string; isoEndDate: string }> {
  if (viewAllOrganisationData) {
    const personIsoStartDate = assignedTeamsPeriods.all[0].isoStartDate;
    const personIsoEndDate = assignedTeamsPeriods.all[0].isoEndDate;
    if (isoStartDate > personIsoEndDate || isoEndDate < personIsoStartDate) {
      return [];
    } else if (isoStartDate < personIsoStartDate && isoEndDate > personIsoEndDate) {
      return [{ isoStartDate: personIsoStartDate, isoEndDate: personIsoEndDate }];
    } else if (isoStartDate < personIsoStartDate && isoEndDate <= personIsoEndDate) {
      return [{ isoStartDate: personIsoStartDate, isoEndDate: isoEndDate }];
    } else if (isoStartDate >= personIsoStartDate && isoEndDate > personIsoEndDate) {
      return [{ isoStartDate: isoStartDate, isoEndDate: personIsoEndDate }];
    } else {
      return [{ isoStartDate: isoStartDate, isoEndDate: isoEndDate }];
    }
  }
  const eachTeamPeriods = [];
  for (const [teamId, teamPeriods] of Object.entries(assignedTeamsPeriods)) {
    if (!selectedTeamsObjectWithOwnPeriod[teamId]) continue;
    const { isoStartDate: teamIsoStartDate, isoEndDate: teamIsoEndDate } = selectedTeamsObjectWithOwnPeriod[teamId];
    for (const { isoStartDate: periodIsoStartDate, isoEndDate: periodIsoEndDate } of teamPeriods) {
      if (periodIsoStartDate > teamIsoEndDate || periodIsoEndDate < teamIsoStartDate) continue;
      if (periodIsoStartDate < teamIsoStartDate && periodIsoEndDate > teamIsoEndDate) {
        eachTeamPeriods.push({ isoStartDate: teamIsoStartDate, isoEndDate: teamIsoEndDate });
      } else if (periodIsoStartDate < teamIsoStartDate && periodIsoEndDate <= teamIsoEndDate) {
        eachTeamPeriods.push({ isoStartDate: teamIsoStartDate, isoEndDate: periodIsoEndDate });
      } else if (periodIsoStartDate >= teamIsoStartDate && periodIsoEndDate > teamIsoEndDate) {
        eachTeamPeriods.push({ isoStartDate: periodIsoStartDate, isoEndDate: teamIsoEndDate });
      } else {
        eachTeamPeriods.push({ isoStartDate: periodIsoStartDate, isoEndDate: periodIsoEndDate });
      }
    }
  }

  const periods = [];
  for (const period of eachTeamPeriods.sort((a, b) => (a.isoStartDate < b.isoStartDate ? -1 : 1))) {
    if (periods.length === 0) {
      periods.push(period);
      continue;
    }
    const lastPeriod = periods[periods.length - 1];
    if (period.isoStartDate > lastPeriod.isoEndDate) {
      periods.push(period);
      continue;
    }
    if (period.isoEndDate > lastPeriod.isoEndDate) {
      lastPeriod.isoEndDate = period.isoEndDate;
    }
    periods[periods.length - 1] = lastPeriod;
  }
  return periods;
}

export function filterPersonByAssignedTeamDuringQueryPeriod({
  viewAllOrganisationData,
  isoStartDate,
  isoEndDate,
  selectedTeamsObjectWithOwnPeriod,
  assignedTeamsPeriods,
}: GetPersonPeriodsArguments): boolean {
  const periods = mergedPersonAssignedTeamPeriodsWithQueryPeriod({
    viewAllOrganisationData,
    isoStartDate,
    isoEndDate,
    selectedTeamsObjectWithOwnPeriod,
    assignedTeamsPeriods,
  });

  console.log(periods);
  return periods.length > 0;
}
