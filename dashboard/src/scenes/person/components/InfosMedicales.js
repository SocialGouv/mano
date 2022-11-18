import { Col, Row } from 'reactstrap';
import { theme } from '../../../config';
import { useRecoilValue } from 'recoil';
import { customFieldsPersonsMedicalSelector } from '../../../recoil/persons';
import { currentTeamState } from '../../../recoil/auth';
import { useMemo, useState } from 'react';
import EditModal from './EditModal';

export default function InfosMedicales({ person }) {
  const [editModal, setEditModal] = useState(false);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const team = useRecoilValue(currentTeamState);
  const customFields = useMemo(() => {
    return customFieldsPersonsMedical.filter((f) => f.enabled || f.enabledTeams?.includes(team._id));
  }, [customFieldsPersonsMedical, team]);
  return (
    <div>
      {Boolean(editModal) && <EditModal person={person} selectedPanel={editModal} onClose={() => setEditModal(false)} />}
      <div className="tw-flex">
        <h4 className="tw-flex-1">Informations Médicales</h4>
        <div>
          <button className="tw-transition hover:tw-scale-125" onClick={() => setEditModal('medical')}>
            ✏️
          </button>
        </div>
      </div>
      <Row>
        <Col md={4}>
          <InfoMedicaleLine label="Couverture médicale" value={person.healthInsurances} />
        </Col>
        <Col md={4}>
          <InfoMedicaleLine label="Structure de suivi médical" value={person.structureMedical} />
        </Col>
        {customFields.map((field) => (
          <Col md={4}>
            <InfoMedicaleLine label={field.label} value={person[field.name]} />
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
        {Array.isArray(value) ? (
          <ul className="tw-list-disc">
            {value.map((v) => (
              <li key={v}>
                <b style={{ color: theme.main }}>{v || '-'}</b>
              </li>
            ))}
          </ul>
        ) : (
          <b style={{ color: theme.main }}>{value || '-'}</b>
        )}
      </div>
    </div>
  );
}
