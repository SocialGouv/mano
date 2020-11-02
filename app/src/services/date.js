const makeSureDate = (date) => {
  if (date instanceof Date) return date;
  return new Date(date);
};

const startOfDay = (date = Date.now()) => {
  const sureDate = makeSureDate(date);
  const newDate = new Date(sureDate.setHours(0, 0, 0, 0));
  return newDate;
};

const startOfDayParsed = (date = Date.now()) => Date.parse(startOfDay(date));

const oneDayMs = 24 * 60 * 60 * 1000;
// we pass now as argument for testing purpose
const isToday = (date, now = Date.now()) => startOfDayParsed(date) === startOfDayParsed(now);
const isTomorrow = (date, now = Date.now()) =>
  startOfDayParsed(date) === startOfDayParsed(now + oneDayMs);
const isComingInDays = (date, days, now = Date.now()) =>
  startOfDayParsed(date) <= startOfDayParsed(now + oneDayMs * days);

const isPassed = (date, now = Date.now()) => Date.parse(new Date(date)) < startOfDay(now);

export { startOfDay, isToday, isTomorrow, isComingInDays, isPassed };
