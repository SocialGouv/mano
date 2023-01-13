import React from 'react';
import { getDuration } from './utils';
import { capture } from '../../services/sentry';
import Card from '../../components/Card';

export const Block = ({ data, title = 'Nombre de personnes suivies', help }) => (
  <div className="tw-px-4 tw-py-2 md:tw-basis-1/2 lg:tw-basis-1/3">
    <Card title={title} count={Array.isArray(data) ? String(data.length) : data} help={help} />
  </div>
);

export const BlockDateWithTime = ({ data, field, help }) => {
  if (!data.filter((item) => Boolean(item[field.name])).length) return null;

  const averageField =
    data.filter((item) => Boolean(item[field.name])).reduce((total, item) => total + Date.parse(item[field.name]), 0) / (data.length || 1);

  const durationFromNowToAverage = Date.now() - averageField;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return <Card title={field.label + ' (moyenne)'} unit={unit} count={count} help={help} />;
};

const twoDecimals = (number) => Math.round(number * 100) / 100;

export const BlockTotal = ({ title, unit, data, field, help }) => {
  try {
    if (!data.length) {
      return <Card title={title} unit={unit} count={0} help={help} />;
    }
    const dataWithOnlyNumbers = data.filter((item) => Boolean(item[field])).filter((e) => !isNaN(Number(e[field])));
    const total = dataWithOnlyNumbers.reduce((total, item) => total + Number(item[field]), 0);
    const avg = total / dataWithOnlyNumbers.length;
    return (
      <Card
        title={title}
        unit={unit}
        count={twoDecimals(total)}
        help={help}
        children={
          <span className="font-weight-normal">
            Moyenne: <strong>{twoDecimals(avg)}</strong>
          </span>
        }
      />
    );
  } catch (errorBlockTotal) {
    capture('error block total', errorBlockTotal, { title, unit, data, field });
  }
  return null;
};
