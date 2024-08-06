import type { PersonPopulated } from "../types/person";
import type { UUIDV4 } from "../types/uuid";
import type { PeriodISODate } from "../types/date";
import type { Filter } from "../types/field";

interface GetPersonPeriodsArguments {
  viewAllOrganisationData: boolean;
  isoStartDate: string;
  isoEndDate: string;
  selectedTeamsObjectWithOwnPeriod: Record<UUIDV4, PeriodISODate>;
  assignedTeamsPeriods: PersonPopulated["assignedTeamsPeriods"];
  filterByStartFollowBySelectedTeamDuringPeriod?: Array<Filter>;
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
  filterByStartFollowBySelectedTeamDuringPeriod,
}: GetPersonPeriodsArguments): boolean {
  if (filterByStartFollowBySelectedTeamDuringPeriod?.length > 0) {
    const filter = filterByStartFollowBySelectedTeamDuringPeriod[0];
    const yes = filter.value === "Oui";
    const no = filter.value === "Non";
    if (yes) {
      if (viewAllOrganisationData) {
        const startFollow = assignedTeamsPeriods.all[0].isoStartDate;
        if (startFollow > isoEndDate) return false;
        if (startFollow < isoStartDate) return false;
        return true;
      }
      for (const [teamId, teamPeriods] of Object.entries(assignedTeamsPeriods)) {
        if (teamId === "all") continue;
        const earliestPeriod = teamPeriods[0];
        if (earliestPeriod.isoStartDate > isoEndDate) continue;
        if (earliestPeriod.isoStartDate < isoStartDate) continue;
        return true;
      }
      return false;
    }
    if (no) {
      if (viewAllOrganisationData) {
        const startFollow = assignedTeamsPeriods.all[0].isoStartDate;
        if (startFollow > isoEndDate) return true;
        if (startFollow < isoStartDate) return true;
        return false;
      }
      for (const [teamId, teamPeriods] of Object.entries(assignedTeamsPeriods)) {
        if (teamId === "all") continue;
        const earliestPeriod = teamPeriods[0];
        if (earliestPeriod.isoStartDate > isoEndDate) return true;
        if (earliestPeriod.isoStartDate < isoStartDate) return true;
      }
      return false;
    }
  }
  const periods = mergedPersonAssignedTeamPeriodsWithQueryPeriod({
    viewAllOrganisationData,
    isoStartDate,
    isoEndDate,
    selectedTeamsObjectWithOwnPeriod,
    assignedTeamsPeriods,
  });

  return periods.length > 0;
}
