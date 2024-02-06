import type { CustomOrPredefinedField } from '../types/field';

export type EvolutiveStatOption = string;
export type EvolutiveStatDateYYYYMMDD = string;
export type EvolutiveStatsPersonFields = Record<
  CustomOrPredefinedField['name'],
  Record<EvolutiveStatOption, Record<EvolutiveStatDateYYYYMMDD, number>>
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
