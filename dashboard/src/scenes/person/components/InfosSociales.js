import { Col, Row } from 'reactstrap';
import { theme } from '../../../config';
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
          <button className="rounded px-2 py-1 tw-bg-main tw-text-sm tw-text-white" onClick={() => setEditModal('social')}>
            Modifier
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
          <InfoSocialeLine label="Type d'hébergement" value={person.addressDetails} />
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
