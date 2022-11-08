import { Col, Row } from 'reactstrap';
import { theme } from '../../../config';
import { useRecoilValue } from 'recoil';
import { customFieldsPersonsSocialSelector } from '../../../recoil/persons';
import { currentTeamState } from '../../../recoil/auth';
import { useMemo } from 'react';

export default function InfosSociales({ person }) {
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const team = useRecoilValue(currentTeamState);
  const customFields = useMemo(() => {
    return customFieldsPersonsSocial.filter((f) => f.enabled || f.enabledTeams?.includes(team._id));
  }, [customFieldsPersonsSocial, team]);
  return (
    <div>
      <h4>Information sociales</h4>
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
            <InfoSocialeLine label={field.label} value={Array.isArray(field.value) ? field.value.join(', ') : field.value} />
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
        <b style={{ color: theme.main }}>{value || '-'}</b>
      </div>
    </div>
  );
}
