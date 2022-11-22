import { Col, Row } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { customFieldsPersonsSocialSelector } from '../../../recoil/persons';
import { currentTeamState } from '../../../recoil/auth';
import { useMemo, useState } from 'react';
import EditModal from './EditModal';

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
          <button className="tw-transition hover:tw-scale-125" onClick={() => setEditModal('social')}>
            ✏️
          </button>
        </div>
      </div>
      <div className="my-4">{person.description}</div>
      <Row>
        <Col md={4}>
          <InfoSocialeLine label="Situation personnelle" value={person.personalSituation} />
        </Col>
        <Col md={4}>
          <InfoSocialeLine label="Structure de suivi social" value={person.structureSocial} />
        </Col>
        <Col md={4}>
          <InfoSocialeLine label="Avec animaux" value={person.hasAnimal} />
        </Col>
        <Col md={4}>
          <InfoSocialeLine label="Hébergement" value={person.address} />
        </Col>
        <Col md={4}>
          <InfoSocialeLine label="Type d'hébergement" value={person.addressDetail} />
        </Col>

        <Col md={4}>
          <InfoSocialeLine label="Nationalité" value={person.nationalitySituation} />
        </Col>
        <Col md={4}>
          <InfoSocialeLine label="Emploi" value={person.employment} />
        </Col>
        <Col md={4}>
          <InfoSocialeLine label="Resources" value={(person.resources || []).join(', ')} />
        </Col>
        <Col md={4}>
          <InfoSocialeLine label="Motif de la situation en rue" value={(person.reasons || []).join(', ')} />
        </Col>
        {customFields.map((field) => (
          <Col md={4}>
            <InfoSocialeLine label={field.label} value={person[field.name]} />
          </Col>
        ))}
      </Row>
    </div>
  );
}

function InfoSocialeLine({ label, value }) {
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
