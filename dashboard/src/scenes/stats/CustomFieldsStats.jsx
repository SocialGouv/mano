import { useRecoilValue } from "recoil";
import { currentTeamState } from "../../recoil/auth";
import { CustomResponsiveBar, CustomResponsivePie } from "./Charts";
import { BlockDateWithTime, BlockTotal } from "./Blocks";
import { getMultichoiceBarData, getPieData } from "./utils";

const CustomFieldsStats = ({ customFields, data, help, onSliceClick, totalTitleForMultiChoice }) => {
  const team = useRecoilValue(currentTeamState);

  const customFieldsInStats = customFields
    .filter((f) => f)
    .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
    .filter((f) => f.showInStats);

  return (
    <div className="tw-flex tw-flex-wrap tw-justify-center tw-items-stretch tw-gap-4">
      {customFieldsInStats.map((field) => {
        if (["number"].includes(field.type)) {
          return (
            <div className="tw-basis-64 tw-shrink-0 tw-grow-0" key={field.name}>
              <BlockTotal title={field.label} data={data} field={field.name} help={help?.(field.label.capitalize())} />
            </div>
          );
        }
        if (["date", "date-with-time", "duration"].includes(field.type)) {
          return (
            <div className="tw-basis-64 tw-shrink-0 tw-grow-0" key={field.name}>
              <BlockDateWithTime data={data} field={field} help={help?.(field.label.capitalize())} />
            </div>
          );
        }
        if (["boolean", "yes-no", "enum"].includes(field.type)) {
          return (
            <div className="tw-basis-full tw-shrink-0" key={field.name}>
              <CustomResponsivePie
                title={field.label}
                help={help?.(field.label.capitalize())}
                onItemClick={onSliceClick ? (newSlice) => onSliceClick?.(newSlice, field.name) : undefined}
                data={getPieData(data, field.name, {
                  options: field.options,
                  isBoolean: field.type === "boolean",
                })}
              />
            </div>
          );
        }
        if (["multi-choice"].includes(field.type)) {
          return (
            <div className="tw-basis-full tw-shrink-0" key={field.name}>
              <CustomResponsiveBar
                title={field.label}
                help={help?.(field.label.capitalize())}
                onItemClick={onSliceClick ? (newSlice) => onSliceClick?.(newSlice, field.name) : undefined}
                isMultiChoice
                axisTitleY="File active"
                axisTitleX={field.name}
                totalForMultiChoice={data.length}
                totalTitleForMultiChoice={totalTitleForMultiChoice}
                data={getMultichoiceBarData(data, field.name, { options: field.options })}
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default CustomFieldsStats;
