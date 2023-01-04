import { useRecoilValue } from 'recoil';
import { currentTeamState } from '../../recoil/auth';
import { Col, Row } from 'reactstrap';
import { CustomResponsivePie } from './charts';
import { BlockDateWithTime, BlockTotal } from './Blocks';
import Card from '../../components/Card';
import { getPieData } from './utils';

const CustomFieldsStats = ({ customFields, data, additionalCols = [], dataTestId = '' }) => {
  const team = useRecoilValue(currentTeamState);
  function getColsSize(totalCols) {
    if (totalCols === 1) return 12;
    if (totalCols === 2) return 6;
    if (totalCols % 4 === 0) return 3;
    return 4;
  }

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
        <Row>
          {additionalCols.map((col) => (
            <Col md={colSize} style={{ marginBottom: 20 }} key={col.title}>
              {/* TODO: fix alignment. */}
              <Card title={col.title} count={col.value} children={<div></div>} dataTestId={dataTestId} />
            </Col>
          ))}
          {customFieldsNumber.map((field) => (
            <Col md={colSize} style={{ marginBottom: '20px' }} key={field.name}>
              <BlockTotal title={field.label} data={data} field={field.name} />
            </Col>
          ))}
          {customFieldsDate.map((field) => (
            <Col md={colSize} style={{ marginBottom: '20px' }} key={field.name}>
              <BlockDateWithTime data={data} field={field} />
            </Col>
          ))}
        </Row>
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
