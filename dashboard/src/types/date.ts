import type { Dayjs } from "dayjs";

export type Period = { startDate: Dayjs | null; endDate: Dayjs | null };
export type PeriodISODate = { isoStartDate: string | null; isoEndDate: string | null };

export type Preset = {
  label: string;
  period: Period;
};
