import { useRecoilValue } from "recoil";
import { evolutiveStatsForPersonsSelector } from "../recoil/evolutiveStats";
import type { PersonPopulated } from "../types/person";
import type { IndicatorsSelection } from "../types/evolutivesStats";
import { ResponsiveStream } from "@nivo/stream";
import { useMemo } from "react";
import { capture } from "../services/sentry";

interface EvolutiveStatsViewerProps {
  evolutiveStatsIndicators: IndicatorsSelection;
  period: {
    startDate: string;
    endDate: string;
  };
  persons: Array<PersonPopulated>;
}

export default function EvolutiveStatsViewer({ evolutiveStatsIndicators, period, persons }: EvolutiveStatsViewerProps) {
  try {
    const evolutiveStatsPerson = useRecoilValue(
      evolutiveStatsForPersonsSelector({
        persons,
        startDate: period.startDate,
        endDate: period.endDate,
        evolutiveStatsIndicators,
      })
    );
    if (!evolutiveStatsPerson) return null;
    const {
      startDateConsolidated,
      endDateConsolidated,
      fieldLabel,
      valueStart,
      valueEnd,
      countStart,
      countEnd,
      fieldData, // structure example for field gender: { 'Homme': { 20240101: 1, 20240102: 2, 20240103: 3 }, 'Femme': { 20240101: 4, 20240102: 5, 20240103: 6 } }
    } = evolutiveStatsPerson;

    if (valueStart == null) return null;
    if (valueEnd == null) {
      return (
        <>
          <h4 className="tw-mb-4">
            Évolution du champ {fieldLabel} entre le {startDateConsolidated.format("DD/MM/YYYY")} et le {endDateConsolidated.format("DD/MM/YYYY")}
          </h4>

          <StreamChart startDateConsolidated={startDateConsolidated} endDateConsolidated={endDateConsolidated} fieldData={fieldData} />
        </>
      );
    }

    return (
      <div className="tw-flex tw-w-full tw-justify-around">
        <div className="tw-flex tw-shrink-0 tw-basis-1/4 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
          <h5>Au {startDateConsolidated.format("DD/MM/YYYY")}</h5>
          <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-around tw-rounded-lg tw-border tw-p-4">
            <p className="tw-text-6xl tw-font-bold tw-text-main">{countStart}</p>
            <p>{valueStart}</p>
          </div>
        </div>
        <div className="tw-flex tw-basis-1/2 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
          {countStart > 0 && (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-around tw-p-4">
              <p className="tw-text-6xl tw-font-bold tw-text-main">{Math.round((countEnd / countStart) * 1000) / 10}%</p>
              <p className="tw-m-0 tw-text-center">
                des{" "}
                <strong>
                  {fieldLabel}: {valueStart}
                </strong>{" "}
                au {startDateConsolidated.format("DD/MM/YYYY")}
                <br />
                {valueStart === valueEnd ? " sont restés à " : " ont évolué vers "}
                <strong>{valueEnd}</strong> au {endDateConsolidated.format("DD/MM/YYYY")}
              </p>
            </div>
          )}
        </div>
        <div className="tw-flex tw-shrink-0 tw-basis-1/4 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
          <h5>Au {endDateConsolidated.format("DD/MM/YYYY")}</h5>
          <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-around tw-rounded-lg tw-border tw-p-4">
            <p className="tw-text-6xl tw-font-bold tw-text-main">{countEnd}</p>
            <p>{valueEnd}</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    capture(error, {
      extra: {
        evolutiveStatsIndicators,
        period,
      },
    });
  }
  return (
    <div>
      <h4>Erreur</h4>
      <p>Une erreur est survenue lors de l'affichage des statistiques évolutives. Les équipes techniques ont été prévenues</p>
    </div>
  );
}

function StreamChart({ fieldData, startDateConsolidated, endDateConsolidated }: any) {
  const chartData = useMemo(() => {
    const data = [];
    const legend = [];
    const daysDiff = endDateConsolidated.diff(startDateConsolidated, "days");
    const spacing = Math.floor(Math.max(1, daysDiff / 6));
    // end date
    const keys = Object.keys(fieldData)
      .map((option) => ({
        key: option,
        value: fieldData[option][endDateConsolidated.format("YYYYMMDD")],
      }))
      .sort((a, b) => b.value - a.value)
      .map((entry) => entry.key);
    const lastDateValue: Record<(typeof keys)[number], number> = {} as any;
    for (const option of keys) {
      const value = fieldData[option][endDateConsolidated.format("YYYYMMDD")];
      lastDateValue[option] = value;
    }
    for (let i = 0; i < daysDiff; i += spacing) {
      const date = startDateConsolidated.add(i, "days");
      legend.push(date.format("DD/MM/YYYY"));
      const dateValue: any = {};
      for (const option of keys) {
        const value = fieldData[option][date.format("YYYYMMDD")];
        dateValue[option] = value;
      }
      data.push(dateValue);
    }
    data.push(lastDateValue);
    legend.push(endDateConsolidated.format("DD/MM/YYYY"));
    return { data, legend, keys };
  }, [startDateConsolidated, endDateConsolidated, fieldData]);

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
          offsetType="none"
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
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">Au {startDateConsolidated.format("DD/MM/YYYY")}</td>
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">Au {endDateConsolidated.format("DD/MM/YYYY")}</td>
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
