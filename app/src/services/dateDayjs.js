import dayjs from 'dayjs';

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

// dayjs is very slow, so we use native Date for this function

// export function formatBirthDate(date) {
//   const birthDate = dayjs(date);
//   return `${birthDate.format('DD/MM/YYYY')} (${formatAge(date)})`;
// }

// export function formatAge(date) {
//   const birthDate = dayjs(date);
//   return birthDate.fromNow(true);
// }

export function formatBirthDate(date) {
  let birthDate = new Date(date);
  let day = String(birthDate.getDate()).padStart(2, '0');
  let month = String(birthDate.getMonth() + 1).padStart(2, '0'); // January is 0!
  let year = birthDate.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatAge(date) {
  if (!date) return null;
  const birthDate = dayjs(date);
  const months = dayjs().diff(birthDate, 'months');
  if (months < 24) return months + ' mois';
  const years = dayjs().diff(birthDate, 'years');
  if (years < 7) {
    const etDemi = months % 12 >= 6;
    if (etDemi) return `${years} ans et demi`;
  }
  return `${years} ans`;
}

export function formatBirthDateAndAge(date) {
  return `${formatAge(date)} ans (${formatBirthDate(date)})`;
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
export function getRelativeTimeFrench(date1, date2) {
  let years = dayjs(date1).diff(date2, 'year');
  date2 = dayjs(date2).add(years, 'years');

  let months = dayjs(date1).diff(date2, 'month');
  date2 = dayjs(date2).add(months, 'months');

  let days = dayjs(date1).diff(date2, 'day');

  // Years and months
  if (years > 0) {
    if (months > 0) {
      return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
    } else {
      return `${years} an${years > 1 ? 's' : ''}`;
    }
  }

  // Months only
  if (months > 0) {
    return `${months} mois`;
  }

  // Days only
  return `${days} jour${days > 1 ? 's' : ''}`;
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

export function dateForDatePicker(date) {
  return date && dayjs(date).isValid() ? dayjs(date).toDate() : null;
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
