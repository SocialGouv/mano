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
    <div className="tw-grid tw-grid-cols-3 sm:tw-grid-cols-6 lg:tw-grid-cols-12 tw-gap-4">
      {customFieldsInStats.map((field) => {
        console.log(field);
        if (["number"].includes(field.type)) {
          return (
            <div className="tw-col-span-3" key={field.name}>
              <BlockTotal title={field.label} data={data} field={field.name} help={help?.(field.label.capitalize())} />
            </div>
          );
        }
        if (["date", "date-with-time", "duration"].includes(field.type)) {
          console.log(data);
          return (
            <div className="tw-col-span-3" key={field.name}>
              <BlockDateWithTime data={data} field={field} help={help?.(field.label.capitalize())} />
            </div>
          );
        }
        if (["boolean", "yes-no", "enum"].includes(field.type)) {
          return (
            <div className="tw-col-span-6 tw-row-span-3" key={field.name}>
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
            <div className="tw-col-span-6 tw-row-span-3" key={field.name}>
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
