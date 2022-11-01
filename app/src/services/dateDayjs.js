import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');
dayjs.extend(relativeTime);
dayjs.extend(isBetween);

/** FORMAT DATES **/

export function formatDateWithFullMonth(date) {
  return `${dayjs(date).format('D MMMM YYYY')}`;
}

export function formatTime(date) {
  return dayjs(date).format('HH:mm');
}

export function formatDateWithNameOfDay(date) {
  return dayjs(date).format('dddd D MMMM YYYY');
}

export function formatDateTimeWithNameOfDay(date) {
  return dayjs(date).format('dddd D MMMM YYYY HH:mm');
}

export function formatBirthDate(date) {
  const birthDate = dayjs(date);
  return `${birthDate.format('DD/MM/YYYY')} (${birthDate.fromNow(true)})`;
}

export function formatCalendarDate(date) {
  if (dayjs(date).isSame(dayjs(), 'day')) {
    return "Aujourd'hui";
  }
  if (dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')) {
    return 'Hier';
  }
  if (dayjs(date).isSame(dayjs().add(1, 'day'), 'day')) {
    return 'Demain';
  }
  return dayjs(date).format('ddd D MMM');
}

/** MANIPULATION AND COMPARISON **/

export function isOnSameDay(date1, date2) {
  return dayjs(date1).isSame(dayjs(date2), 'day');
}

export function isToday(date) {
  return dayjs(date).isSame(dayjs(), 'day');
}

export function addOneDay(date) {
  return dayjs(date).add(1, 'day');
}

export function subtractOneDay(date) {
  return dayjs(date).subtract(1, 'day');
}

export function startOfToday() {
  return dayjs().startOf('day');
}

export function now() {
  return dayjs();
}

export function isAfterToday(date) {
  return dayjs(date).isAfter(dayjs());
}

export function dateForDatePicker(date) {
  return date && dayjs(date).isValid() ? dayjs(date).toDate() : null;
}

export function getMonths() {
  const startOfThisMonth = dayjs().startOf('month');
  return Array.from({ length: 12 }, (_, index) => startOfThisMonth.subtract(index, 'month'));
}

export function getDaysOfMonth(date) {
  const days = [];
  const firstDayOfTheMonth = dayjs(date).startOf('month');
  for (let i = 0; i < dayjs(date).daysInMonth(); i++) {
    days.push(firstDayOfTheMonth.add(i, 'day'));
  }
  return days;
}

export const getIsDayWithinHoursOffsetOfDay = (dayToTest, referenceDay, offsetHours = -12) => {
  return getIsDayWithinHoursOffsetOfPeriod(dayToTest, { referenceStartDay: referenceDay, referenceEndDay: referenceDay }, offsetHours);
};

export const getIsDayWithinHoursOffsetOfPeriod = (dayToTest, { referenceStartDay, referenceEndDay }, offsetHours = -12) => {
  if (!dayToTest) return false;

  const startDate = dayjs(referenceStartDay).startOf('day').add(offsetHours, 'hour');
  const endDate = dayjs(referenceEndDay).startOf('day').add(1, 'day').add(offsetHours, 'hour');

  // Parameter 4 is a string with two characters; '[' means inclusive, '(' exclusive
  // '()' excludes start and end date (default)
  // '[]' includes start and end date
  // '[)' includes the start date but excludes the stop
  // Source: https://day.js.org/docs/en/plugin/is-between
  // we need '[)' because
  // -> the date of reports is at the start of the day
  // -> the date of anonymous passages is at the start of the day
  return dayjs(dayToTest).isBetween(startDate, endDate, null, '[)');
};

export const dayjsInstance = dayjs;
