import { useRecoilValue } from 'recoil';
import { currentTeamState } from '../../recoil/auth';
import { CustomResponsivePie } from './charts';
import { BlockDateWithTime, BlockTotal } from './Blocks';
import Card from '../../components/Card';
import { getPieData } from './utils';

function getColsSize(totalCols) {
  if (totalCols === 1) return 'full';
  if (totalCols === 2) return '1/2';
  if (totalCols % 4 === 0) return '1/3';
  return '1/4';
}

const CustomFieldsStats = ({ customFields, data, additionalCols = [], dataTestId = '' }) => {
  const team = useRecoilValue(currentTeamState);

  const customFieldsInStats = customFields
    .filter((f) => f)
    .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
    .filter((f) => f.showInStats);

  const customFieldsNumber = customFieldsInStats.filter((field) => ['number'].includes(field.type));
  const customFieldsDate = customFieldsInStats.filter((field) => ['date', 'date-with-time'].includes(field.type));
  const customFieldsResponsivePie = customFieldsInStats.filter((field) => ['boolean', 'yes-no', 'enum', 'multi-choice'].includes(field.type));

  const totalCols = customFieldsNumber.length + customFieldsDate.length + additionalCols.length;

  const colSize = getColsSize(totalCols);

  return (
    <>
      {totalCols > 0 && (
        <>
          {/* tailwind doesn't comile dynamic classes, so we need to declare them */}
          <div className="tw-hidden tw-basis-1/4 tw-basis-1/2 tw-basis-1/3 tw-basis-full" />
          <div className="-tw-mx-4 tw-flex tw-flex-wrap">
            {additionalCols.map((col) => (
              <div className={`tw-px-4 tw-py-2 tw-basis-${colSize}`} key={col.title}>
                {/* TODO: fix alignment. */}
                <Card title={col.title} count={col.value} children={<div></div>} dataTestId={dataTestId} />
              </div>
            ))}
            {customFieldsNumber.map((field) => (
              <div className={`tw-px-4 tw-py-2 tw-basis-${colSize}`} key={field.name}>
                <BlockTotal title={field.label} data={data} field={field.name} />
              </div>
            ))}
            {customFieldsDate.map((field) => (
              <div className={`tw-px-4 tw-py-2 tw-basis-${colSize}`} key={field.name}>
                <BlockDateWithTime data={data} field={field} />
              </div>
            ))}
          </div>
        </>
      )}
      {customFieldsResponsivePie.map((field) => (
        <CustomResponsivePie
          title={field.label}
          key={field.name}
          data={getPieData(data, field.name, { options: field.options, isBoolean: field.type === 'boolean' })}
        />
      ))}
    </>
  );
};

export default CustomFieldsStats;
