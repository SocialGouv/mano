import type { CustomOrPredefinedField } from "../types/field";

export type EvolutiveStatOption = string;

export type IndicatorValue = any;
export type Indicator = {
  fieldName: string | null;
  fromValue: IndicatorValue;
  toValue: IndicatorValue;
  type: string | null;
};
export type IndicatorsSelection = Array<Indicator>;
export type IndicatorsBase = Array<CustomOrPredefinedField>;
