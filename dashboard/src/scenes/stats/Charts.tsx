import { useMemo } from "react";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import HelpButtonAndModal from "../../components/HelpButtonAndModal";

function EmptyData({ title, help }) {
  return (
    <div className="tw-m-0 tw-grid tw-gap-12 tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-main25 tw-bg-white tw-p-4  print:tw-break-before-all print:tw-break-inside-avoid">
      <div className="tw-mx-auto tw-text-center tw-text-lg tw-font-medium tw-text-black tw-mt-4 tw-flex tw-justify-center print:tw-basis-0 print:tw-mb-0">
        <div>
          {title} {!!help && <HelpButtonAndModal title={title} help={help} />}
        </div>
      </div>
      <div className="mx-auto tw-pb-4 tw-max-w-[450px] tw-text-center tw-text-gray-400">
        <p className="tw-text-lg tw-font-bold">Aucun élément à afficher</p>
        <p className="tw-mt-2 tw-text-sm">
          Pour afficher des données pour ce graphique, vérifiez le contexte sélectionné (dates, équipe, filtres, etc.)
        </p>
      </div>
    </div>
  );
}

export type PieData = Array<{ id: string; label: string; value: number }>;

export const CustomResponsivePie = ({
  data = [],
  title,
  onItemClick = null,
  help,
}: {
  data: PieData;
  title: string;
  onItemClick?: (id: string) => void;
  help?: string;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const onClick = ({ id }) => {
    if (!onItemClick) return;
    onItemClick(id);
  };

  if (data.length === 0) return <EmptyData title={title} help={help} />;

  return (
    <div className="tw-m-0 tw-grid tw-grid-cols-7 print:tw-grid-cols-1 tw-gap-12 tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-rounded-2xl tw-border tw-border-main25 tw-bg-white tw-p-4  print:tw-break-before-all print:tw-break-inside-avoid">
      <div
        className={[
          "tw-relative tw-col-span-7 print:tw-col-span-1 tw-mt-4 tw-flex tw-basis-full tw-justify-center print:tw-basis-0 print:tw-mb-0",
          data.length > 40 ? "print:!tw-mb-4 print:!tw-mt-0" : "",
        ].join(" ")}
      >
        <p className="tw-m-0 tw-inline-block tw-text-center tw-text-lg tw-font-medium tw-text-black">
          {title} {!!help && <HelpButtonAndModal title={title} help={help} />}
        </p>
      </div>
      <div className="tw-flex tw-w-full tw-col-span-3 print:tw-col-span-1 tw-items-center tw-justify-center">
        <table className="tw-w-full tw-border tw-border-zinc-200 tw-text-sm print:tw-max-w-xl">
          <thead>
            <tr className="tw-bg-zinc-100">
              <th className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-max-w-32">
                <div className="tw-truncate tw-max-w-full">{title}</div>
              </th>
              <th className="tw-text-right tw-border tw-border-zinc-200 tw-py-1 tw-px-2">Nb</th>
              {total ? <th className="tw-text-right tw-border tw-border-zinc-200 tw-py-1 tw-px-2">%</th> : <></>}
            </tr>
          </thead>
          <tbody>
            {[...data]
              .sort((a, b) => {
                if (a.value === b.value) return 0;
                if (a.value < b.value) return 1;
                return -1;
              })
              .map(({ id, label, value }) => (
                <tr key={id + label + value} onClick={() => onClick({ id })}>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 [overflow-wrap:anywhere]">{label}</td>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right">{value}</td>
                  {total ? (
                    <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right">
                      {`${Math.round((value / total) * 1000) / 10}`}&nbsp;%
                    </td>
                  ) : (
                    <></>
                  )}
                </tr>
              ))}
            <tr>
              <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-font-bold">Total</td>
              <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right tw-font-bold">{total}</td>
              {total ? <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right tw-font-bold">100&nbsp;%</td> : <></>}
            </tr>
          </tbody>
        </table>
      </div>
      <div
        className={[
          "tw-col-span-4 print:tw-col-span-1 tw-flex tw-h-80 tw-items-center tw-justify-center tw-font-bold print:tw-order-2 print:!tw-w-none print:tw-mx-auto",
          onItemClick ? "[&_path]:tw-cursor-pointer" : "",
        ].join(" ")}
      >
        <ResponsivePie
          data={total ? data : []}
          sortByValue
          fit
          margin={{ top: 40, right: 0, bottom: 40, left: 0 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          startAngle={360}
          endAngle={0}
          colors={{ scheme: "set2" }}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
          arcLinkLabelsSkipAngle={data.length > 20 ? 12 : 8}
          arcLabelsSkipAngle={data.length > 20 ? 12 : 8}
          enableArcLinkLabels
          onClick={onClick}
          arcLabelsTextColor="#333333"
          valueFormat={(value) => `${value} (${Math.round((value / total) * 1000) / 10}%)`}
        />
      </div>
    </div>
  );
};

export type BarData = Array<{ name: string; [key: string]: string }>;

const getItemValue = (item: { name: string; [key: string]: string }) => {
  return Number(item[item.name] || 0);
};

export const CustomResponsiveBar = ({
  title,
  data,
  categories,
  onItemClick,
  // axisTitleX,
  axisTitleY,
  isMultiChoice,
  totalForMultiChoice,
  totalTitleForMultiChoice,
  help,
}: {
  title: string;
  data: BarData;
  categories?: string[];
  onItemClick?: (id: string) => void;
  axisTitleY: string;
  isMultiChoice?: boolean;
  totalForMultiChoice?: number;
  totalTitleForMultiChoice?: string;
  help?: string;
}) => {
  // if we have too many categories with small data, we see nothing in the chart
  // so we filter by keeping the first 15 categories whatever
  const chartData = data.filter((c) => c.name !== "Non renseigné").filter((_, index) => index < 15);
  const showWarning = chartData.length < data.filter((c) => c.name !== "Non renseigné").length;
  if (!categories) {
    categories = chartData.map((cat) => cat.name);
  }

  const biggestValue = useMemo(() => {
    if (!isMultiChoice) {
      return chartData.map((item) => getItemValue(item)).reduce((max, value) => Math.max(max, Number(value)), 1);
    }
    // if we have multiple choice, data is sorted already in getMultichoiceBarData
    const biggestItem = chartData[0]; // { name: 'A name', ['A name']: 123 }
    const biggestItemValue = biggestItem?.[biggestItem?.name];
    return Number(biggestItemValue || 1);
  }, [chartData, isMultiChoice]);

  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + getItemValue(item), 0);
  }, [data]);

  const onClick = ({ id }) => {
    if (!onItemClick) return;
    onItemClick(id);
  };

  if (data.length === 0) return <EmptyData title={title} help={help} />;

  return (
    <div className="tw-m-0 tw-grid tw-grid-cols-7 print:tw-grid-cols-1 tw-gap-12 tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-rounded-2xl tw-border tw-border-main25 tw-bg-white tw-p-4  print:tw-break-before-all print:tw-break-inside-avoid">
      <div className="tw-relative tw-col-span-7 print:tw-col-span-1 tw-mt-4 tw-flex tw-basis-full tw-justify-center print:tw-basis-0 print:tw-mb-0">
        <p className="tw-m-0 tw-inline-block tw-text-center tw-text-lg tw-font-medium tw-text-black">
          {title} {!!help && <HelpButtonAndModal title={title} help={help} />}
        </p>
      </div>
      <div className="tw-flex tw-w-full tw-col-span-3 print:tw-col-span-1 tw-items-center tw-justify-center">
        <table className="tw-w-full tw-border tw-border-zinc-200 tw-text-sm print:tw-max-w-xl">
          <thead>
            <tr className="tw-bg-zinc-100">
              <th className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-max-w-32">
                <div className="tw-truncate tw-max-w-full">{title}</div>
              </th>
              <th className="tw-text-right tw-border tw-border-zinc-200 tw-py-1 tw-px-2">Nb</th>
              <th className="tw-text-right tw-border tw-border-zinc-200 tw-py-1 tw-px-2">%</th>
            </tr>
          </thead>
          <tbody>
            {[...data].map((item) => {
              return (
                <tr key={item.name} onClick={() => onClick({ id: item.name })}>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2">{item.name}</td>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right">{getItemValue(item)}</td>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right">
                    {`${Math.round((getItemValue(item) / (isMultiChoice ? totalForMultiChoice : total)) * 1000) / 10}`}&nbsp;%
                  </td>
                </tr>
              );
            })}
            {!isMultiChoice && (
              <tr>
                <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-font-bold ">Total</td>
                <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right tw-font-bold ">{total}</td>
                {total ? <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right tw-font-bold ">100 %</td> : <></>}
              </tr>
            )}
            {Boolean(isMultiChoice) && Boolean(totalForMultiChoice) && (
              <>
                <tr>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2">{totalTitleForMultiChoice}</td>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right tw-font-bold">{totalForMultiChoice}</td>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2"></td>
                </tr>
                <tr>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-font-bold">Total des valeurs</td>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2 tw-text-right tw-font-bold">{total}</td>
                  <td className="tw-border tw-border-zinc-200 tw-py-1 tw-px-2"></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      <div
        className={[
          "tw-col-span-4 print:tw-col-span-1 tw-flex tw-h-80 tw-items-center tw-justify-center tw-font-bold print:tw-order-2 print:!tw-w-none print:tw-mx-auto",
          onItemClick ? "[&_rect]:tw-cursor-pointer" : "",
        ].join(" ")}
      >
        {!!showWarning && (
          <div className="tw-l-0 tw-r-0 tw-absolute tw-top-0 -tw-mt-5">
            <p className="tw-m-0 tw-mx-auto tw-w-3/4 tw-text-center tw-text-xs tw-font-normal tw-text-gray-500">
              Le top-15 des catégories est affiché, les autres sont cachées pour une meilleure lisibilité.
            </p>
          </div>
        )}
        <ResponsiveBar
          data={chartData}
          keys={categories}
          onClick={onClick}
          indexBy="name"
          margin={{ top: 10, right: 0, bottom: 60, left: 60 }}
          padding={0.3}
          maxValue={biggestValue}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={{ scheme: "set2" }}
          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 2,
            tickPadding: 5,
            tickRotation: -15,
            // legend: axisTitleX,
            legendPosition: "middle",
            legendOffset: 50,
          }}
          axisLeft={{
            tickSize: 5,
            format: (e) => (e ? (Math.floor(e) === e ? e : "") : ""),
            tickPadding: 5,
            tickRotation: 0,
            legend: axisTitleY,
            legendPosition: "middle",
            legendOffset: -50,
          }}
          labelSkipWidth={0}
          labelSkipHeight={0}
          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          animate={true}
        />
      </div>
    </div>
  );
};
