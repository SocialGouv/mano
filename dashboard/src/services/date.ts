import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

dayjs.locale("fr");
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

/** FORMAT DATES **/
type PossibleDate = string | Date | Dayjs | null;

export function formatDateWithFullMonth(date: PossibleDate): string {
  return `${dayjs(date).format("D MMMM YYYY")}`;
}

export function formatTime(date: PossibleDate): string {
  return dayjs(date).format("HH:mm");
}

export function formatDateWithNameOfDay(date?: PossibleDate): string {
  return dayjs(date).format("dddd D MMMM YYYY");
}

export function formatDateTimeWithNameOfDay(date: PossibleDate): string {
  return dayjs(date).format("dddd D MMMM YYYY HH:mm");
}

export function formatBirthDate(date: PossibleDate): string | null {
  if (!date) return null;
  const birthDate = dayjs(date);
  return `${birthDate.format("DD/MM/YYYY")} (${formatAge(date)})`;
}

export function formatAge(date: PossibleDate): string | null {
  if (!date) return null;
  const birthDate = dayjs(date);
  const months = Math.abs(dayjs().diff(birthDate, "months"));
  if (months < 24) return months + " mois";
  const years = Math.abs(dayjs().diff(birthDate, "years"));
  if (years < 7) {
    const etDemi = months % 12 >= 6;
    if (etDemi) return `${years} ans et demi`;
  }
  return `${years} ans`;
}

export function formatDuration(date: PossibleDate): string | null {
  const years = dayjs().diff(date, "years");
  const months = dayjs().add(-years, "years").diff(date, "months");
  const days = dayjs().add(-years, "years").add(-months, "months").diff(date, "days");
  const yearsString = years > 0 ? `${years} an${years > 1 ? "s" : ""}` : "";
  const monthsString = months > 0 ? `${months} mois` : "";
  const daysString = days > 0 ? `${days} jour${days > 1 ? "s" : ""}` : "";
  if (years > 0) {
    if (months > 0) {
      if (days > 0) {
        return `${yearsString}, ${monthsString} et ${daysString}`;
      }
      return `${yearsString} et ${monthsString}`;
    }
    if (days > 0) {
      return `${yearsString} et ${daysString}`;
    }
    return yearsString;
  }
  if (months > 0) {
    if (days > 0) {
      return `${monthsString} et ${daysString}`;
    }
    return monthsString;
  }
  return daysString;
}

export function ageFromBirthdateAsYear(date: PossibleDate): number | null {
  if (!date) return null;
  const birthDate = dayjs(date);
  return dayjsInstance(dayjsInstance()).diff(birthDate, "year");
}

export function formatCalendarDate(date: PossibleDate): string | null {
  if (dayjs(date).isSame(dayjs(), "day")) {
    return "Aujourd'hui";
  }
  if (dayjs(date).isSame(dayjs().subtract(1, "day"), "day")) {
    return "Hier";
  }
  if (dayjs(date).isSame(dayjs().add(1, "day"), "day")) {
    return "Demain";
  }
  return dayjs(date).format("ddd D MMM");
}

/** MANIPULATION AND COMPARISON **/

export function isOnSameDay(date1: PossibleDate, date2: PossibleDate): boolean {
  return dayjs(date1).isSame(dayjs(date2), "day");
}

export function isToday(date: PossibleDate): boolean {
  return dayjs(date).isSame(dayjs(), "day");
}

export function addOneDay(date: PossibleDate): Dayjs {
  return dayjs(date).add(1, "day");
}

export function subtractOneDay(date: PossibleDate): Dayjs {
  return dayjs(date).subtract(1, "day");
}

export function startOfToday(): Dayjs {
  return dayjs().startOf("day");
}

export function now(): Dayjs {
  return dayjs();
}

export function dateForDatePicker(date: PossibleDate): Date | null {
  return date && dayjs(date).isValid() ? dayjs(date).toDate() : null;
}

export function dateForInputDate(date: PossibleDate, withTime = false): string {
  return date && dayjs(date).isValid()
    ? dayjs(date)
        .format(withTime ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD")
        .padStart(withTime ? 16 : 10, "0")
    : "";
}

export const LEFT_BOUNDARY_DATE = "1900-01-01";
export const RIGHT_BOUNDARY_DATE = "2100-01-01";
export function outOfBoundariesDate(date: PossibleDate): boolean {
  return dayjs(date).isBefore(dayjs(LEFT_BOUNDARY_DATE)) || dayjs(date).isAfter(dayjs(RIGHT_BOUNDARY_DATE));
}
export function dateFromInputDate(date: PossibleDate): Date | null {
  return date && dayjs(date).isValid() ? dayjs(date).toDate() : null;
}

export const getIsDayWithinHoursOffsetOfPeriod = (dayToTest: PossibleDate, { referenceStartDay, referenceEndDay }, offsetHours = -12) => {
  if (!dayToTest) return false;

  const startDate = dayjs(referenceStartDay).startOf("day").add(offsetHours, "hour");
  const endDate = dayjs(referenceEndDay).startOf("day").add(1, "day").add(offsetHours, "hour");

  // Parameter 4 is a string with two characters; '[' means inclusive, '(' exclusive
  // '()' excludes start and end date (default)
  // '[]' includes start and end date
  // '[)' includes the start date but excludes the stop
  // Source: https://day.js.org/docs/en/plugin/is-between
  // we need '[)' because
  // -> the date of reports is at the start of the day
  // -> the date of anonymous passages is at the start of the day
  return dayjs(dayToTest).isBetween(startDate, endDate, null, "[)");
};

export function fromDateString(dateString: PossibleDate): Dayjs {
  return dayjs(dateString, ["YYYY-MM-DD", "DD/MM/YYYY", "DD/MM/YY", "D/M/YYYY", "D/M/YY", "D/MM/YYYY", "D/MM/YY"], "fr", true);
}

export const dayjsInstance = dayjs;
