import { Col, Row } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { customFieldsPersonsSocialSelector } from '../../../recoil/persons';
import { currentTeamState } from '../../../recoil/auth';
import { useMemo, useState } from 'react';
import EditModal from './EditModal';
import CustomFieldDisplay from '../../../components/CustomFieldDisplay';

export default function InfosSociales({ person }) {
  const [editModal, setEditModal] = useState(false);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const team = useRecoilValue(currentTeamState);
  const customFields = useMemo(() => {
    return customFieldsPersonsSocial.filter((f) => f.enabled || f.enabledTeams?.includes(team._id));
  }, [customFieldsPersonsSocial, team]);
  return (
    <div>
      {Boolean(editModal) && <EditModal person={person} selectedPanel={editModal} onClose={() => setEditModal(false)} />}
      <div className="tw-flex">
        <h4 className="tw-flex-1">Informations sociales</h4>
        <div>
          <button
            className="tw-transition hover:tw-scale-125"
            onClick={() => setEditModal('social')}
            aria-label="Éditer les informations sociales"
            title="Éditer les informations sociales">
            ✏️
          </button>
        </div>
      </div>
      <div className="my-4">{person.description}</div>
      <Row>
        {customFields.map((field, i) => (
          <Col key={field.label + i} md={4}>
            <InfoSocialeLine type={field.type} label={field.label} value={person[field.name]} />
          </Col>
        ))}
      </Row>
    </div>
  );
}

function InfoSocialeLine({ label, value, type = 'text' }) {
  return (
    <div className="my-2">
      <div className="tw-text-sm tw-font-semibold tw-text-gray-600">{label}</div>
      <div>
        <CustomFieldDisplay type={type} value={value} />
      </div>
    </div>
  );
}
