import dayjs from 'dayjs';
import { filterData } from '../../components/Filters';

export const getDataForPeriod = (
  data,
  { startDate, endDate },
  { filters = [], field = 'createdAt', backupField = 'createdAt', allSelectedTeamsAreNightSession } = {},
  callback = null
) => {
  if (!!filters?.filter((f) => Boolean(f?.value)).length) data = filterData(data, filters);
  if (!startDate || !endDate) {
    return data;
  }

  if (callback) {
    return callback(data);
  }

  const offsetHours = allSelectedTeamsAreNightSession ? 12 : 0;

  const isoStartDate = dayjs(startDate).startOf('day').add(offsetHours, 'hour').toISOString();
  const isoEndDate = dayjs(endDate).startOf('day').add(1, 'day').add(offsetHours, 'hour').toISOString();

  return data.filter((item) => {
    const date = item[field] || item[backupField] || item.createdAt;
    if (date < isoStartDate) return false;
    if (date > isoEndDate) return false;
    return true;
  });
};

export const getDuration = (timestampFromNow) => {
  const inDays = Math.round(timestampFromNow / 1000 / 60 / 60 / 24);
  if (inDays < 90) return [inDays, 'jours'];
  const inMonths = inDays / (365 / 12);
  if (inMonths < 24) return [Math.round(inMonths), 'mois'];
  const inYears = inDays / 365.25;
  return [Math.round(inYears), 'années'];
};

export const getPieData = (source, key, { options = null, isBoolean = false, debug = false } = {}) => {
  const data = source.reduce(
    (newData, item) => {
      if (isBoolean) {
        newData[Boolean(item[key]) ? 'Oui' : 'Non']++;
        return newData;
      }
      if (!item[key] || !item[key].length || item[key].includes('Choisissez') || item[key].includes('Choisir')) {
        newData['Non renseigné']++;
        return newData;
      }
      if (options && options.length) {
        let hasMatched = false;
        for (let option of [...options, 'Uniquement']) {
          if (typeof item[key] === 'string' ? item[key] === option : item[key].includes(option)) {
            if (!newData[option]) newData[option] = 0;
            newData[option]++;
            hasMatched = true;
          }
        }
        if (!hasMatched) {
          if (typeof item[key] === 'string') {
            const unregisteredOption = item[key];
            if (!newData[unregisteredOption]) newData[unregisteredOption] = 0;
            newData[unregisteredOption]++;
          }
        }
        return newData;
      }
      if (!newData[item[key]]) newData[item[key]] = 0;
      newData[item[key]]++;
      return newData;
    },
    { 'Non renseigné': 0, Oui: 0, Non: 0 }
  );
  return Object.keys(data)
    .map((key) => ({ id: key, label: key, value: data[key] }))
    .filter((d) => d.value > 0);
};
