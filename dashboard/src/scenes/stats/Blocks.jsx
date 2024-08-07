import { getDuration } from "./utils";
import Card from "../../components/Card";

export const Block = ({ data, title = "Nombre de personnes suivies", help = null }) => (
  <Card title={title} count={Array.isArray(data) ? String(data.length) : data} help={help} />
);

export const BlockDateWithTime = ({ data, field, help }) => {
  if (!data.filter((item) => Boolean(item[field.name])).length) {
    return (
      <Card title={field.label} unit="" help={help}>
        <div className="mx-auto tw-pb-4 tw-text-center tw-text-gray-400">
          <p className="tw-text-lg tw-font-bold">Pas de donnée à afficher</p>
        </div>
      </Card>
    );
  }

  const filteredData = data.filter((item) => Boolean(item[field.name]));
  const total = filteredData.reduce((acc, item) => acc + Date.parse(item[field.name]), 0);
  const averageField = total / (filteredData.length || 1);

  const durationFromNowToAverage = Date.now() - averageField;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return <Card title={field.label + " (moyenne)"} unit={unit} count={count} help={help} />;
};

const twoDecimals = (number) => Math.round(number * 100) / 100;

export const BlockTotal = ({ title, unit, data, field, help }) => {
  if (!data.length) {
    return (
      <Card title={title} unit={unit} help={help}>
        <div className="mx-auto tw-pb-4 tw-text-center tw-text-gray-400">
          <p className="tw-text-lg tw-font-bold">Pas de donnée à afficher</p>
        </div>
      </Card>
    );
  }
  const dataWithOnlyNumbers = data.filter((item) => Boolean(item[field])).filter((e) => !isNaN(Number(e[field])));
  const total = dataWithOnlyNumbers.reduce((total, item) => total + Number(item[field]), 0);
  const avg = total / dataWithOnlyNumbers.length;
  return (
    <Card title={title} unit={unit} count={twoDecimals(total)} help={help}>
      <span className="font-weight-normal">
        Moyenne: <strong>{isNaN(avg) ? "-" : twoDecimals(avg)}</strong>
      </span>
    </Card>
  );
};
