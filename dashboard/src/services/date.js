/* eslint-disable no-extend-native */

// todo: remove prototype pollution.
Date.prototype.getBirthDate = function (locale) {
  return new Date(this).toLocaleDateString(locale, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
};

Date.prototype.getAge = function (locale, roundHalf) {
  const now = new Date();
  let years = now.getFullYear() - this.getFullYear();
  let suffix = locale === 'fr' ? `an${years > 1 ? 's' : ''}` : 'yo';
  const showHalf = roundHalf && now.getMonth() - this.getMonth() > -6 ? ',5' : '';
  if (now.getMonth() > this.getMonth()) return `${years}${showHalf} ${suffix}`;
  if (now.getMonth() < this.getMonth()) return `${years - 1}${showHalf} ${suffix}`;
  if (now.getDate() < this.getDate()) return `${years - 1}${showHalf} ${suffix}`;
  return `${years} ${suffix}`;
};

export const displayBirthDate = (date, { reverse = false, roundHalf = false } = {}) => {
  try {
    if (!date) return 'JJ-MM-AAAA';
    const birthdate = new Date(date).getBirthDate('fr');
    const age = new Date(date).getAge('fr', roundHalf);
    if (reverse) return `${age} (${birthdate})`;
    return `${birthdate} (${age})`;
  } catch (errorBirthDate) {
    console.log('cannot convert birth date', errorBirthDate);
    console.log(date);
  }
};

export const isOnSameDay = (first, second) =>
  first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();

export const theSameDay = (date = new Date()) => {
  date = new Date(date);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const theDayBefore = (date = new Date()) => {
  date = new Date(date);
  date.setDate(date.getDate() - 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const theDayAfter = (date = new Date()) => {
  date = new Date(date);
  date.setDate(date.getDate() + 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const today = () => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const getMonths = () => {
  const months = [];
  let date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setDate(1);
  for (let i = 0; i < 12; i++) {
    months.push(new Date(date));
    date.setMonth(date.getMonth() - 1);
  }
  return months;
};

export const getIsDayWithinHoursOffsetOfDay = (dayToTest, referenceDay, offsetHours = -12, debug = false) => {
  return getIsDayWithinHoursOffsetOfPeriod(dayToTest, { referenceStartDay: referenceDay, referenceEndDay: referenceDay }, offsetHours, debug);
};

export const getIsDayWithinHoursOffsetOfPeriod = (dayToTest, { referenceStartDay, referenceEndDay }, offsetHours = -12, debug = true) => {
  if (!dayToTest) return false;

  referenceStartDay = new Date(referenceStartDay);
  referenceStartDay.setHours(0, 0, 0, 0);
  const startDate = new Date(referenceStartDay);
  startDate.setHours(referenceStartDay.getHours() + offsetHours);

  referenceEndDay = new Date(referenceEndDay);
  referenceEndDay.setHours(0, 0, 0, 0);
  const endDate = new Date(referenceEndDay);
  endDate.setHours(referenceEndDay.getHours() + offsetHours + 24);

  dayToTest = new Date(dayToTest).toISOString();

  if (debug) {
    console.log({
      dayToTest,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      test: dayToTest > startDate.toISOString() && dayToTest <= endDate.toISOString(),
    });
  }

  return dayToTest > startDate.toISOString() && dayToTest <= endDate.toISOString();
};
