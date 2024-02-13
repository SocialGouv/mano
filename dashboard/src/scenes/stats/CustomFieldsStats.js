import { useRecoilValue } from 'recoil';
import { currentTeamState } from '../../recoil/auth';
import { CustomResponsiveBar, CustomResponsivePie } from './charts';
import { BlockDateWithTime, BlockTotal } from './Blocks';
import Card from '../../components/Card';
import { getMultichoiceBarData, getPieData } from './utils';

const CustomFieldsStats = ({ customFields, data, additionalCols = [], dataTestId = '', help, onSliceClick, totalTitleForMultiChoice }) => {
  const team = useRecoilValue(currentTeamState);

  const customFieldsInStats = customFields
    .filter((f) => f)
    .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
    .filter((f) => f.showInStats);

  return (
    <>
      <div className="-tw-mx-4 tw-flex tw-flex-wrap tw-justify-around">
        {additionalCols.map((col) => (
          <div className="tw-basis-1/4 tw-px-4 tw-py-2" key={col.title}>
            {/* TODO: fix alignment. */}
            <Card
              title={col.title}
              count={col.value}
              children={<div></div>}
              dataTestId={dataTestId}
              help={help?.(col.title.capitalize())}
              onClick={col.onBlockClick ? col.onBlockClick : null}
            />
          </div>
        ))}
      </div>
      {customFieldsInStats.map((field) => {
        if (['number'].includes(field.type)) {
          return (
            <div className="tw-basis-1/4 tw-px-4 tw-py-2" key={field.name}>
              <BlockTotal title={field.label} data={data} field={field.name} help={help?.(field.label.capitalize())} />
            </div>
          );
        }
        if (['date', 'date-with-time'].includes(field.type)) {
          return (
            <div className="tw-basis-1/4 tw-px-4 tw-py-2" key={field.name}>
              <BlockDateWithTime data={data} field={field} help={help?.(field.label.capitalize())} />
            </div>
          );
        }
        if (['boolean', 'yes-no', 'enum'].includes(field.type)) {
          return (
            <CustomResponsivePie
              title={field.label}
              help={help?.(field.label.capitalize())}
              onItemClick={onSliceClick ? (newSlice) => onSliceClick?.(newSlice, field.name) : undefined}
              key={field.name}
              data={getPieData(data, field.name, {
                options: field.options,
                isBoolean: field.type === 'boolean',
              })}
            />
          );
        }
        if (['multi-choice'].includes(field.type)) {
          return (
            <CustomResponsiveBar
              title={field.label}
              help={help?.(field.label.capitalize())}
              onItemClick={onSliceClick ? (newSlice) => onSliceClick?.(newSlice, field.name) : undefined}
              key={field.name}
              isMultiChoice
              axisTitleY="File active"
              axisTitleX={field.name}
              totalForMultiChoice={data.length}
              totalTitleForMultiChoice={totalTitleForMultiChoice}
              data={getMultichoiceBarData(data, field.name, { options: field.options })}
            />
          );
        }
        return null;
      })}
    </>
  );
};

export default CustomFieldsStats;
