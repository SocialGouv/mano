import { useMemo } from 'react';
import { Col, Row } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { Title } from '../../../components/header';
import UserName from '../../../components/UserName';
import { teamsState } from '../../../recoil/auth';
import { personFieldsIncludingCustomFieldsSelector } from '../../../recoil/persons';
import { formatDateWithFullMonth, dayjsInstance } from '../../../services/date';

// FIX: there was a bug in history at some point, where the whole person was saved in the history
// this function removes those entries
export const cleanHistory = (history) => {
  return history.filter((h) => {
    if (JSON.stringify(h.data).includes('_id')) return false;
    return true;
  });
};

const History = ({ person }) => {
  const personFieldsIncludingCustomFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);
  const teams = useRecoilValue(teamsState);
  const history = useMemo(() => cleanHistory([...(person.history || [])]).reverse(), [person.history]);

  return (
    <div>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={4}>
          <Title>Historique</Title>
        </Col>
      </Row>
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Donnée</th>
          </tr>
        </thead>
        <tbody className="small">
          {history.map((h) => {
            return (
              <tr key={h.date} className="tw-cursor-default">
                <td>{dayjsInstance(h.date).format('DD/MM/YYYY HH:mm')}</td>
                <td>
                  <UserName id={h.user} />
                </td>
                <td className="tw-max-w-prose">
                  {Object.entries(h.data).map(([key, value]) => {
                    const personField = personFieldsIncludingCustomFields.find((f) => f.name === key);
                    if (key === 'merge') {
                      return (
                        <p className="tw-flex tw-flex-col" key={key}>
                          <span>
                            Fusion avec : <code>"{value.name}"</code>
                          </span>
                          <small className="tw-opacity-30">
                            Identifiant: <code>"{value._id}"</code>
                          </small>
                        </p>
                      );
                    }
                    if (key === 'assignedTeams') {
                      return (
                        <p className="tw-flex tw-flex-col" key={key}>
                          <span>{personField?.label} : </span>
                          <code>"{(value.oldValue || []).map((teamId) => teams.find((t) => t._id === teamId)?.name).join(', ')}"</code>
                          <span>↓</span>
                          <code>"{(value.newValue || []).map((teamId) => teams.find((t) => t._id === teamId)?.name).join(', ')}"</code>
                        </p>
                      );
                    }
                    if (key === 'outOfActiveListReasons') {
                      if (!value.newValue.length) return null;
                      return (
                        <p className="tw-flex tw-flex-col" key={key}>
                          <span>{personField?.label}: </span>
                          <code>{value.newValue.join(', ')}</code>
                        </p>
                      );
                    }
                    if (key === 'outOfActiveList') {
                      return (
                        <p className="tw-flex tw-flex-col" key={key}>
                          <span>{value.newValue === true ? 'Sortie de file active' : 'Réintégration dans la file active'}</span>
                        </p>
                      );
                    }
                    if (key === 'outOfActiveListDate') {
                      if (!value.newValue) return null;
                      return (
                        <p className="tw-flex tw-flex-col" key={key}>
                          <span>{formatDateWithFullMonth(value.newValue)}</span>
                        </p>
                      );
                    }

                    return (
                      <p
                        key={key}
                        data-test-id={`${personField?.label || 'Champs personnalisé supprimé'}: ${JSON.stringify(
                          value.oldValue || ''
                        )} ➔ ${JSON.stringify(value.newValue)}`}>
                        {personField?.label || 'Champs personnalisé supprimé'} : <br />
                        <code>{JSON.stringify(value.oldValue || '')}</code> ➔ <code>{JSON.stringify(value.newValue)}</code>
                      </p>
                    );
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default History;
