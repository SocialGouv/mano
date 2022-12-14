import { Col, Row } from 'reactstrap';
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
          <button
            className="tw-transition hover:tw-scale-125"
            onClick={() => setEditModal('medical')}
            aria-label="Éditer les informations médicales"
            title="Éditer les informations médicales">
            ✏️
          </button>
        </div>
      </div>
      <Row>
        {customFields.map((field, i) => (
          <Col key={field.label + i} md={4}>
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
      <div className="tw-text-sm tw-font-semibold tw-text-gray-600">{label}</div>
      <div>
        {Array.isArray(value) ? (
          <ul className="tw-list-disc">
            {value.map((v) => (
              <li key={v}>
                <span className="tw-overflow-ellipsis tw-break-words">{v || '-'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tw-overflow-ellipsis tw-break-words">{value || '-'}</p>
        )}
      </div>
    </div>
  );
}
