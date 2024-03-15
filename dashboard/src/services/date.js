import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";

dayjs.locale("fr");
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

/** FORMAT DATES **/

export function formatDateWithFullMonth(date) {
  return `${dayjs(date).format("D MMMM YYYY")}`;
}

export function formatTime(date) {
  return dayjs(date).format("HH:mm");
}

export function formatDateWithNameOfDay(date) {
  return dayjs(date).format("dddd D MMMM YYYY");
}

export function formatDateTimeWithNameOfDay(date) {
  return dayjs(date).format("dddd D MMMM YYYY HH:mm");
}

export function formatBirthDate(date) {
  if (!date) return null;
  const birthDate = dayjs(date);
  return `${birthDate.format("DD/MM/YYYY")} (${formatAge(date)})`;
}

export function formatAge(date) {
  if (!date) return null;
  const birthDate = dayjs(date);
  return birthDate.fromNow(true);
}

export function ageFromBirthdateAsYear(date) {
  if (!date) return null;
  const birthDate = dayjs(date);
  return dayjsInstance(dayjsInstance()).diff(birthDate, "year");
}

export function formatCalendarDate(date) {
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

export function isOnSameDay(date1, date2) {
  return dayjs(date1).isSame(dayjs(date2), "day");
}

export function isToday(date) {
  return dayjs(date).isSame(dayjs(), "day");
}

export function addOneDay(date) {
  return dayjs(date).add(1, "day");
}

export function subtractOneDay(date) {
  return dayjs(date).subtract(1, "day");
}

export function startOfToday() {
  return dayjs().startOf("day");
}

export function now() {
  return dayjs();
}

export function dateForDatePicker(date) {
  return date && dayjs(date).isValid() ? dayjs(date).toDate() : null;
}

export function dateForInputDate(date, withTime = false) {
  return date && dayjs(date).isValid()
    ? dayjs(date)
        .format(withTime ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD")
        .padStart(withTime ? 16 : 10, "0")
    : "";
}
export const LEFT_BOUNDARY_DATE = "1900-01-01";
export const RIGHT_BOUNDARY_DATE = "2100-01-01";
export function outOfBoundariesDate(date) {
  return dayjs(date).isBefore(dayjs(LEFT_BOUNDARY_DATE)) || dayjs(date).isAfter(dayjs(RIGHT_BOUNDARY_DATE));
}
export function dateFromInputDate(date) {
  return date && dayjs(date).isValid() ? dayjs(date).toDate() : null;
}

export const getIsDayWithinHoursOffsetOfPeriod = (dayToTest, { referenceStartDay, referenceEndDay }, offsetHours = -12) => {
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

export function fromDateString(dateString) {
  return dayjs(dateString, ["YYYY-MM-DD", "DD/MM/YYYY", "DD/MM/YY", "D/M/YYYY", "D/M/YY", "D/MM/YYYY", "D/MM/YY"], "fr", true);
}

export const dayjsInstance = dayjs;
