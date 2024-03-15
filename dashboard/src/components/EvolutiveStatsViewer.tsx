import { useRecoilValue } from "recoil";
import { evolutiveStatsIndicatorsBaseSelector, evolutiveStatsPersonSelector, startHistoryFeatureDate } from "../recoil/evolutiveStats";
import type { PersonPopulated } from "../types/person";
import type { IndicatorsSelection } from "../types/evolutivesStats";
import { dayjsInstance } from "../services/date";
import { ResponsiveStream } from "@nivo/stream";
import { useMemo } from "react";

interface EvolutiveStatsViewerProps {
  evolutiveStatsIndicators: IndicatorsSelection;
  period: {
    startDate: string;
    endDate: string;
  };
  persons: Array<PersonPopulated>;
}

export default function EvolutiveStatsViewer({ evolutiveStatsIndicators, period, persons }: EvolutiveStatsViewerProps) {
  const startDate = period.startDate;
  const endDate = period.endDate;
  const indicatorsBase = useRecoilValue(evolutiveStatsIndicatorsBaseSelector);
  const evolutiveStatsPerson = useRecoilValue(
    evolutiveStatsPersonSelector({
      persons,
      startDate: period.startDate ? dayjsInstance(period.startDate).format("YYYY-MM-DD") : null,
      evolutiveStatsIndicators,
    })
  );
  if (!evolutiveStatsIndicators.length) return null;
  const indicator = evolutiveStatsIndicators[0];
  if (!indicator.fieldName) return null;

  const startDateFormatted = dayjsInstance(startDate ?? startHistoryFeatureDate);
  const endDateFormatted = endDate ? dayjsInstance(endDate) : dayjsInstance();

  if (startDateFormatted.isSame(endDateFormatted)) return null;

  const fieldStart = indicator.fromValue;
  const fieldEnd = indicator.toValue;

  const field = indicatorsBase.find((field) => field.name === indicator.fieldName);

  if (fieldEnd == null) {
    return (
      <>
        <h4 className="tw-mb-4">
          Évolution du champ {field?.label} entre le {startDateFormatted.format("DD/MM/YYYY")} et le {endDateFormatted.format("DD/MM/YYYY")}
        </h4>

        <MyResponsiveStream
          startDateFormatted={startDateFormatted}
          endDateFormatted={endDateFormatted}
          indicator={indicator}
          evolutiveStatsPerson={evolutiveStatsPerson}
        />
      </>
    );
  }

  const valueStart = evolutiveStatsPerson[indicator.fieldName][fieldStart][startDateFormatted.format("YYYYMMDD")];
  const valueEnd = evolutiveStatsPerson[indicator.fieldName][fieldEnd][endDateFormatted.format("YYYYMMDD")];

  return (
    <div className="tw-flex tw-w-full tw-justify-around">
      <div className="tw-flex tw-shrink-0 tw-basis-1/4 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
        <h5>Au {startDateFormatted.format("DD/MM/YYYY")}</h5>
        <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-around tw-rounded-lg tw-border tw-p-4">
          <p className="tw-text-6xl tw-font-bold tw-text-main">{valueStart}</p>
          <p>{fieldStart}</p>
        </div>
      </div>
      {valueStart !== 0 && (
        <>
          <div className="tw-flex tw-basis-1/2 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-around tw-p-4">
              <p className="tw-text-6xl tw-font-bold tw-text-main">{Math.round((valueEnd / valueStart) * 1000) / 10}%</p>
              <p className="tw-m-0 tw-text-center">
                des{" "}
                <strong>
                  {field?.label}: {fieldStart}
                </strong>{" "}
                au {startDateFormatted.format("DD/MM/YYYY")}
                <br />
                {fieldStart === fieldEnd ? " sont restés à " : " ont évolué vers "}
                <strong>{fieldEnd}</strong> au {endDateFormatted.format("DD/MM/YYYY")}
              </p>
            </div>
          </div>
          <div className="tw-flex tw-shrink-0 tw-basis-1/4 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
            <h5>Au {endDateFormatted.format("DD/MM/YYYY")}</h5>
            <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-around tw-rounded-lg tw-border tw-p-4">
              <p className="tw-text-6xl tw-font-bold tw-text-main">{valueEnd}</p>
              <p>{fieldEnd}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MyResponsiveStream({ indicator, evolutiveStatsPerson, startDateFormatted, endDateFormatted }: any) {
  const chartData = useMemo(() => {
    if (!indicator.fieldName) return { data: [], legend: [], keys: [] };
    const data = [];
    const legend = [];
    const fieldData = evolutiveStatsPerson[indicator.fieldName];
    const daysDiff = endDateFormatted.diff(startDateFormatted, "days");
    const spacing = Math.floor(Math.max(1, daysDiff / 6));
    for (let i = 0; i < daysDiff; i += spacing) {
      const date = startDateFormatted.add(i, "days");
      legend.push(date.format("DD/MM/YYYY"));
      const dateValue: any = {};
      for (const option of Object.keys(fieldData)) {
        const value = fieldData[option][date.format("YYYYMMDD")];
        dateValue[option] = value;
      }
      data.push(dateValue);
    }
    // end date
    legend.push(endDateFormatted.format("DD/MM/YYYY"));
    const lastDateValue: Record<string, number> = {};
    for (const option of Object.keys(fieldData)) {
      const value = fieldData[option][endDateFormatted.format("YYYYMMDD")];
      lastDateValue[option] = value;
    }
    data.push(lastDateValue);
    const keys = Object.entries(lastDateValue)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);
    return { data, legend, keys };
  }, [startDateFormatted, endDateFormatted, evolutiveStatsPerson, indicator.fieldName]);

  return (
    <div>
      <div
        className={[
          "tw-mx-auto tw-flex tw-h-[50vh] tw-w-[50vw] tw-basis-full tw-items-center tw-justify-center tw-font-bold print:tw-w-[600px] print:tw-max-w-[55%] print:!tw-grow print:!tw-basis-0",
          // onItemClick ? '[&_path]:tw-cursor-pointer' : '',
        ].join(" ")}
      >
        <ResponsiveStream
          data={chartData.data}
          keys={chartData.keys}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            // ori: 'bottom',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -15,
            legend: "",
            legendOffset: 36,
            format: (index) => chartData.legend[index],
          }}
          axisLeft={{
            // orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            truncateTickAt: 1,
            legend: "",
            legendOffset: -40,
            format: (e) => (Math.floor(e) === e ? e : ""),
          }}
          curve="basis"
          enableGridX={true}
          enableGridY={false}
          offsetType="diverging"
          colors={{ scheme: "set2" }}
          fillOpacity={0.85}
          borderColor={{ theme: "background" }}
          dotSize={8}
          dotColor={{ from: "color" }}
          dotBorderWidth={2}
          dotBorderColor={{
            from: "color",
            modifiers: [["darker", 0.7]],
          }}
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              translateX: 100,
              itemWidth: 80,
              itemHeight: 20,
              itemTextColor: "#999999",
              symbolSize: 12,
              symbolShape: "circle",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemTextColor: "#000000",
                  },
                },
              ],
            },
          ]}
        />
      </div>
      <div className="tw-flex tw-basis-1/3 tw-items-center tw-justify-center">
        <table className="tw-w-full tw-border tw-border-zinc-400">
          <thead>
            <tr>
              <td className="tw-border tw-border-zinc-400 tw-p-1">Option</td>
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">Au {startDateFormatted.format("DD/MM/YYYY")}</td>
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">Au {endDateFormatted.format("DD/MM/YYYY")}</td>
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">Différence</td>
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">Différence (%)</td>
            </tr>
          </thead>
          <tbody>
            {chartData.keys.map((option) => {
              const startValue = chartData.data[0][option];
              const endValue = chartData.data.at(-1)[option];
              const diff = endValue - startValue;
              const sign = diff > 0 ? "+" : "";
              const percentDiff = startValue === 0 || endValue === 0 ? 0 : Math.round((diff / startValue) * 1000) / 10;
              return (
                <tr key={option}>
                  <td className="tw-border tw-border-zinc-400 tw-p-1">{option}</td>
                  <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">{startValue}</td>
                  <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">{endValue}</td>
                  <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">{diff === 0 ? "" : `${sign}${diff}`}</td>
                  <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">{percentDiff === 0 ? "" : `${sign}${percentDiff}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
