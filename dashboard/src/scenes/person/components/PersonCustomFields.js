import { Col, Row } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { currentTeamState } from '../../../recoil/auth';
import { useMemo, useState } from 'react';
import EditModal from './EditModal';
import CustomFieldDisplay from '../../../components/CustomFieldDisplay';

export default function PersonCustomFields({ person, sectionName, fields }) {
  const [editModal, setEditModal] = useState(false);
  const team = useRecoilValue(currentTeamState);
  const enabledFields = useMemo(() => {
    return fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id));
  }, [fields, team]);
  return (
    <div className="pt-4 p-3 border tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
      {Boolean(editModal) && <EditModal person={person} selectedPanel={editModal} onClose={() => setEditModal(false)} />}
      <div className="tw-flex">
        <h4 className="tw-flex-1">{sectionName}</h4>
        <div>
          <button
            className="tw-transition hover:tw-scale-125"
            onClick={() => setEditModal(sectionName)}
            aria-label={`Éditer les ${sectionName.toLowerCase()}`}
            title={`Éditer les ${sectionName.toLowerCase()}`}>
            ✏️
          </button>
        </div>
      </div>
      <Row>
        {enabledFields.map((field, i) => (
          <Col key={field.label + i} md={4}>
            <div className="my-2 [overflow-wrap:anywhere]">
              <div className="tw-text-sm tw-font-semibold tw-text-gray-600">{field.label}</div>
              <div>
                <CustomFieldDisplay type={field.type} value={person[field.name]} />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}
