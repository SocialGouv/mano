import type { CustomOrPredefinedField } from "../types/field";
import type { UUIDV4 } from "./uuid";

export type EvolutiveStatOption = string;
export type EvolutiveStatDateYYYYMMDD = string;
export type EvolutiveStatsPersonFields = Record<
  CustomOrPredefinedField["name"],
  Record<EvolutiveStatOption, Record<EvolutiveStatDateYYYYMMDD, number>>
>;
export type EvolutiveStatsOldestStatusPersonFields = Record<
  CustomOrPredefinedField["name"],
  Record<EvolutiveStatOption, Record<EvolutiveStatDateYYYYMMDD, Array<UUIDV4>>>
>;

export type IndicatorValue = any;
export type Indicator = {
  fieldName: string | null;
  fromValue: IndicatorValue;
  toValue: IndicatorValue;
  type: string | null;
};
export type IndicatorsSelection = Array<Indicator>;
export type IndicatorsBase = Array<CustomOrPredefinedField>;
