import React from 'react';
import { getDuration } from './utils';
import { capture } from '../../services/sentry';
import Card from '../../components/Card';

export const Block = ({ data, title = 'Nombre de personnes suivies' }) => (
  <div className="tw-px-4 tw-py-2 md:tw-basis-1/2 lg:tw-basis-1/3">
    <Card title={title} count={Array.isArray(data) ? String(data.length) : data} />
  </div>
);

export const BlockDateWithTime = ({ data, field }) => {
  if (!data.filter((item) => Boolean(item[field.name])).length) return null;

  const averageField =
    data.filter((item) => Boolean(item[field.name])).reduce((total, item) => total + Date.parse(item[field.name]), 0) / (data.length || 1);

  const durationFromNowToAverage = Date.now() - averageField;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return <Card title={field.label + ' (moyenne)'} unit={unit} count={count} />;
};

export const BlockTotal = ({ title, unit, data, field }) => {
  try {
    if (!data.length) {
      return <Card title={title} unit={unit} count={0} />;
    }
    const dataWithOnlyNumbers = data.filter((item) => Boolean(item[field])).filter((e) => !isNaN(Number(e[field])));
    const total = dataWithOnlyNumbers.reduce((total, item) => total + Number(item[field]), 0);
    const avg = Math.round((total / data.length) * 100) / 100;
    return (
      <Card
        title={title}
        unit={unit}
        count={total}
        children={
          <span className="font-weight-normal">
            Moyenne: <strong>{avg}</strong>
          </span>
        }
      />
    );
  } catch (errorBlockTotal) {
    capture('error block total', errorBlockTotal, { title, unit, data, field });
  }
  return null;
};
