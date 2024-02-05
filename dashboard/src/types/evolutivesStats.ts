import type { CustomOrPredefinedField } from '../types/field';

export type EvolutiveStatOption = string;
export type EvolutiveStatDateYYYYMMDD = string;
export type EvolutiveStatsPersonFields = Record<
  CustomOrPredefinedField['name'],
  Record<EvolutiveStatOption, Record<EvolutiveStatDateYYYYMMDD, number>>
>;
