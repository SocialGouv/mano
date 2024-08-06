import { selector, selectorFamily } from "recoil";
import structuredClone from "@ungap/structured-clone";
import { capture } from "../services/sentry";
import type { PersonPopulated } from "../types/person";
import type { CustomOrPredefinedField } from "../types/field";
import type { IndicatorsSelection } from "../types/evolutivesStats";
import type { EvolutiveStatOption } from "../types/evolutivesStats";
import type { UUIDV4 } from "../types/uuid";
import type { PeriodISODate } from "../types/date";
import { dayjsInstance } from "../services/date";
import { forbiddenPersonFieldsInHistory, personFieldsIncludingCustomFieldsSelector } from "./persons";
import type { Dayjs } from "dayjs";
import { currentTeamState } from "./auth";
import { mergedPersonAssignedTeamPeriodsWithQueryPeriod } from "../utils/person-merge-assigned-team-periods-with-query-period";
import { getPersonSnapshotAtDate } from "../utils/person-snapshot";
import { getValueByField } from "../utils/person-get-value-by-field";

export const evolutiveStatsIndicatorsBaseSelector = selector({
  key: "evolutiveStatsIndicatorsBaseSelector",
  get: ({ get }) => {
    const allFields = get(personFieldsIncludingCustomFieldsSelector);
    const currentTeam = get(currentTeamState);
    const indicatorsBase = allFields
      .filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id))
      .filter((f) => {
        if (f.name === "history") return false;
        if (f.name === "documents") return false;
        switch (f.type) {
          case "text":
          case "textarea":
          case "date":
          case "duration":
          case "date-with-time":
            return false;
          case "multi-choice":
          case "number":
          case "yes-no":
          case "enum":
          case "boolean":
          default:
            return f.filterable;
        }
      });

    return indicatorsBase;
  },
});

export const startHistoryFeatureDate = "2022-09-23";

type EvolutiveStatRenderData = {
  indicatorFieldLabel: CustomOrPredefinedField["label"];
  valueStart: EvolutiveStatOption;
  valueEnd: EvolutiveStatOption;
  startDateConsolidated: Dayjs;
  endDateConsolidated: Dayjs;
  countSwitched: number;
  countPersonSwitched: number;
  percentSwitched: number;
  personsIdsSwitchedByValue: Record<EvolutiveStatOption, Array<PersonPopulated["id"]>>;
};

export function computeEvolutiveStatsForPersons({
  startDate,
  endDate,
  persons,
  evolutiveStatsIndicators,
  evolutiveStatsIndicatorsBase,
  viewAllOrganisationData,
  selectedTeamsObjectWithOwnPeriod,
}: {
  startDate: string | null;
  endDate: string | null;
  persons: Array<PersonPopulated>;
  evolutiveStatsIndicators: IndicatorsSelection;
  evolutiveStatsIndicatorsBase: Array<CustomOrPredefinedField>;
  viewAllOrganisationData: boolean;
  selectedTeamsObjectWithOwnPeriod: Record<UUIDV4, PeriodISODate>;
}): EvolutiveStatRenderData {
  // concepts:
  // we select "indicators" (for now only one by one is possible) that are fields of the person
  // one indicator is: one `field`, one `fromValue` and one `toValue`
  // we want to see the number of switches from `fromValue` to `toValue` for the `field` of the persons - one person can have multiple switches
  // if only `field` is defined, we present nothing for now
  // if `fromValue` is defined, we present nothing from now - we will present the number of switches to any values from the `fromValue`
  // if `toValue` is defined, we present two numbers only
  // how do we calculate ?
  // we start by the snapshot at the initial value (a snapshot is the picture of a person at a given date)
  // then we go forward in time, and when we meet an entry in the history for the field,
  // we ignore the history dates outside the period
  // we check the number of switches from `fromValue` to `toValue` for the field during the period
  // CAREFUL: if there is an `intermediateValue` between `fromValue` and `toValue`, it's not a switch

  const startDateConsolidated = startDate
    ? dayjsInstance(dayjsInstance(startDate).startOf("day").format("YYYY-MM-DD"))
    : dayjsInstance(startHistoryFeatureDate);

  const endDateConsolidated = endDate ? dayjsInstance(dayjsInstance(endDate).endOf("day").format("YYYY-MM-DD")) : dayjsInstance();

  const queryStartDateFormatted = startDateConsolidated.format("YYYY-MM-DD");
  let queryEndDateFormatted = endDateConsolidated.format("YYYY-MM-DD");
  const tonight = dayjsInstance().endOf("day").format("YYYY-MM-DD");
  queryEndDateFormatted = queryEndDateFormatted > tonight ? queryEndDateFormatted : tonight;

  // for now we only support one indicator
  const indicator = evolutiveStatsIndicators[0];
  const field = evolutiveStatsIndicatorsBase.find((f) => f.name === indicator.fieldName);
  const indicatorFieldName = field?.name;
  const indicatorFieldLabel = field?.label; // exemple: "Ressources"
  const indicatorFieldType = field?.type;

  const valueStart = indicator?.fromValue;
  const valueEnd = indicator?.toValue;

  const typesByFields = { [indicatorFieldName]: indicatorFieldType };

  // FIXME: should we have evolutive stats on a single day ?
  if (startDateConsolidated.isSame(endDateConsolidated))
    return {
      countSwitched: 0,
      countPersonSwitched: 0,
      percentSwitched: 0,
      indicatorFieldLabel,
      valueStart,
      valueEnd,
      startDateConsolidated,
      endDateConsolidated,
      personsIdsSwitchedByValue: {},
    };

  const personsIdsSwitchedByValue: Record<EvolutiveStatOption, Array<PersonPopulated["id"]>> = {};

  for (const person of persons) {
    const personPeriods = mergedPersonAssignedTeamPeriodsWithQueryPeriod({
      viewAllOrganisationData,
      isoStartDate: queryStartDateFormatted,
      isoEndDate: queryEndDateFormatted,
      selectedTeamsObjectWithOwnPeriod,
      assignedTeamsPeriods: person.assignedTeamsPeriods,
    });
    for (const period of personPeriods) {
      const periodStartDate = dayjsInstance(period.isoStartDate).format("YYYY-MM-DD");
      if (periodStartDate > queryEndDateFormatted) continue;
      const initSnapshotDate = periodStartDate > queryStartDateFormatted ? periodStartDate : queryStartDateFormatted;
      const initSnapshot = getPersonSnapshotAtDate({
        person,
        snapshotDate: initSnapshotDate,
        typesByFields,
        onlyForFieldName: indicatorFieldName,
        replaceNullishWithNonRenseigne: true,
      });
      let countSwitchedValueDuringThePeriod = 0;

      const currentRawValue = getValueByField(indicatorFieldName, indicatorFieldType, initSnapshot[indicatorFieldName ?? ""]);
      let currentValue = Array.isArray(currentRawValue) ? currentRawValue : [currentRawValue].filter(Boolean);
      let currentPerson = initSnapshot;

      for (const historyItem of person.history ?? []) {
        const historyDate = dayjsInstance(historyItem.date).format("YYYY-MM-DD");
        if (periodStartDate === historyDate) continue; // we don't want to take the snapshot date (it's already done before the loop)
        if (historyDate < initSnapshotDate) continue;
        if (historyDate > queryEndDateFormatted) break;

        let nextPerson = structuredClone(currentPerson);
        for (const historyChangeField of Object.keys(historyItem.data)) {
          if (historyChangeField !== indicatorFieldName) continue; // we support only one indicator for now
          if (forbiddenPersonFieldsInHistory.includes(indicatorFieldName)) continue;
          if (indicatorFieldName === "merge") continue;
          const oldValue = getValueByField(indicatorFieldName, indicatorFieldType, historyItem.data[historyChangeField].oldValue);
          const historyNewValue = getValueByField(indicatorFieldName, indicatorFieldType, historyItem.data[historyChangeField].newValue);
          const currentPersonValue = getValueByField(indicatorFieldName, indicatorFieldType, currentPerson[historyChangeField]);
          if (JSON.stringify(oldValue) !== JSON.stringify(currentPersonValue)) {
            capture(new Error("Incoherent history in computeEvolutiveStatsForPersons"), {
              extra: {
                personPeriods,
                periodStartDate,
                historyDate,
                initSnapshotDate,
                queryEndDateFormatted,
                historyItem,
                historyChangeField,
                oldValue,
                historyNewValue,
                currentPersonValue,
                // currentPerson,
                // person,
                // initSnapshot,
              },
            });
          }

          if (oldValue === "") continue;
          nextPerson = {
            ...nextPerson,
            [historyChangeField]: historyNewValue,
          };
        }
        const nextRawValue = getValueByField(indicatorFieldName, indicatorFieldType, nextPerson[indicatorFieldName ?? ""]);
        const nextValue = Array.isArray(nextRawValue) ? nextRawValue : [nextRawValue].filter(Boolean);

        if (historyDate >= queryStartDateFormatted) {
          // now we have the person at the date of the history item

          if (currentValue.includes(valueStart)) {
            if (!nextValue.includes(valueStart)) {
              countSwitchedValueDuringThePeriod++;
              for (const value of nextValue) {
                if (!personsIdsSwitchedByValue[value]) {
                  personsIdsSwitchedByValue[value] = [];
                }
                personsIdsSwitchedByValue[value].push(person._id);
              }
            }
          }
        }
        currentPerson = nextPerson;
        currentValue = nextValue;
      }

      if (countSwitchedValueDuringThePeriod === 0) {
        if (!personsIdsSwitchedByValue[valueStart]) {
          personsIdsSwitchedByValue[valueStart] = [];
        }
        // FIXME: is there a bug here ? we don'tcheck if the person has the valueStart, should we ?
        personsIdsSwitchedByValue[valueStart].push(person._id); // from `fromValue` to `fromValue`
      }
    }
  }

  const countSwitched = personsIdsSwitchedByValue[valueEnd]?.length ?? 0;
  const personsIdsSwitched = [...new Set(personsIdsSwitchedByValue[valueEnd] ?? [])];
  // TODO FIXME: is this percentage really useful ?
  const countPersonSwitched = personsIdsSwitched.length;
  const percentSwitched = Math.round((persons.length ? countPersonSwitched / persons.length : 0) * 100);

  return {
    countSwitched,
    countPersonSwitched,
    percentSwitched,
    indicatorFieldLabel,
    valueStart,
    valueEnd,
    startDateConsolidated,
    endDateConsolidated,
    personsIdsSwitchedByValue,
  };
}

export const evolutiveStatsForPersonsSelector = selectorFamily({
  key: "evolutiveStatsForPersonsSelector",
  get:
    ({
      startDate,
      endDate,
      persons,
      evolutiveStatsIndicators,
      viewAllOrganisationData,
      selectedTeamsObjectWithOwnPeriod,
    }: {
      startDate: string | null;
      endDate: string | null;
      persons: Array<PersonPopulated>;
      evolutiveStatsIndicators: IndicatorsSelection;
      viewAllOrganisationData: boolean;
      selectedTeamsObjectWithOwnPeriod: Record<UUIDV4, PeriodISODate>;
    }) =>
    ({ get }) => {
      const evolutiveStatsIndicatorsBase = get(evolutiveStatsIndicatorsBaseSelector);

      return computeEvolutiveStatsForPersons({
        startDate,
        endDate,
        persons,
        evolutiveStatsIndicators,
        evolutiveStatsIndicatorsBase,
        viewAllOrganisationData,
        selectedTeamsObjectWithOwnPeriod,
      });
    },
});
