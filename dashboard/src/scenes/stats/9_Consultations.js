import React from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';
import { organisationState } from '../../recoil/auth';
import { useRecoilValue } from 'recoil';
import { Col, Row } from 'reactstrap';
import { Block } from './Blocks';
import CustomFieldsStats from './CustomFieldsStats';

const ConsultationsStats = ({ consultations }) => {
  const organisation = useRecoilValue(organisationState);
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des consultations</h3>
      <Row style={{ marginBottom: '20px' }}>
        <Col md={4} />
        <Block data={consultations} title="Nombre de consultations" />
        <Col md={4} />
      </Row>
      <CustomResponsivePie title="Consultations par type" data={getPieData(consultations, 'type')} />
      <CustomResponsivePie title="Consultations par statut" data={getPieData(consultations, 'status')} />
      {organisation.consultations.map((c) => {
        return (
          <div key={c.name}>
            <h4 style={{ color: '#444', fontSize: '20px', margin: '2rem 0' }}>Statistiques des consultations de type « {c.name} »</h4>
            <CustomFieldsStats data={consultations.filter((d) => d.type === c.name)} customFields={c.fields} />
          </div>
        );
      })}
    </>
  );
};

export default ConsultationsStats;
