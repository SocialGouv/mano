import { Col, Row } from 'reactstrap';
import { Actions } from './Actions';
import Comments from '../../../components/Comments';
import { theme } from '../../../config';
import { useRecoilValue } from 'recoil';
import { customFieldsPersonsMedicalSelector, customFieldsPersonsSocialSelector } from '../../../recoil/persons';
import { currentTeamState } from '../../../recoil/auth';
import { useMemo } from 'react';

export default function InfosMedicales({ person }) {
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const team = useRecoilValue(currentTeamState);
  const customFields = useMemo(() => {
    return customFieldsPersonsMedical.filter((f) => f.enabled || f.enabledTeams?.includes(team._id));
  }, [customFieldsPersonsMedical, team]);
  return (
    <div>
      <h4>Information Medicales</h4>
      <Row>
        <Col md={4}>
          <InfoMedicaleLine label="Couverture médicale" value={person.healthInsurance} />
        </Col>
        <Col md={4}>
          <InfoMedicaleLine label="Structure de suivi médical" value={person.structureMedical} />
        </Col>
        {customFields.map((field) => (
          <Col md={4}>
            <InfoMedicaleLine label={field.label} value={Array.isArray(field.value) ? field.value.join(', ') : field.value} />
          </Col>
        ))}
      </Row>
    </div>
  );
}

function InfoMedicaleLine({ label, value }) {
  return (
    <div className="my-2">
      <div>{label} :</div>
      <div>
        <b style={{ color: theme.main }}>{value || '-'}</b>
      </div>
    </div>
  );
}
