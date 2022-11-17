import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import ButtonCustom from '../../../components/ButtonCustom';
import Passage from '../../../components/Passage';
import Rencontre from '../../../components/Rencontre';
import TagTeam from '../../../components/TagTeam';
import { currentTeamState, usersState, userState } from '../../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../../services/date';

export default function PassagesRencontres({ person }) {
  const { passages, rencontres } = person;
  const [selected, setSelected] = useState('passages');
  return (
    <Container>
      <div class="tw-mb-4 tw-flex tw-items-center tw-justify-center tw-font-semibold">
        <button
          className={`tw-rounded-l-lg tw-border-y tw-border-l tw-border-main tw-py-2 tw-px-4 tw-transition ${
            selected === 'passages' ? ' tw-bg-main tw-text-white' : 'tw-bg-white tw-text-main'
          }`}
          onClick={() => setSelected('passages')}>
          Passages
        </button>
        <button
          className={`tw-rounded-r-lg tw-border-y tw-border-r tw-border-main tw-py-2 tw-px-4 tw-transition ${
            selected === 'rencontres' ? ' tw-bg-main tw-text-white' : 'tw-bg-white tw-text-main'
          }`}
          onClick={() => setSelected('rencontres')}>
          Rencontres
        </button>
      </div>
      <table className="table table-striped">
        <tbody className="small">
          {selected === 'passages' ? (
            <Passages passages={passages} personId={person._id} />
          ) : (
            <Rencontres rencontres={rencontres} personId={person._id} />
          )}
        </tbody>
      </table>
    </Container>
  );
}

function Passages({ passages, personId }) {
  const users = useRecoilValue(usersState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const [passageToEdit, setPassageToEdit] = useState(null);
  return (
    <>
      <ButtonCustom
        className="tw-mb-4"
        title="Ajouter un passage"
        onClick={() =>
          setPassageToEdit({
            user: user._id,
            team: currentTeam._id,
            person: personId,
          })
        }
      />
      <Passage passage={passageToEdit} onFinished={() => setPassageToEdit(null)} />
      {(passages || []).map((passage) => {
        return (
          <tr onClick={(passage) => setPassageToEdit(passage)}>
            <td>
              <div>{formatDateTimeWithNameOfDay(passage.date || passage.createdAt)}</div>
              <div className="content">
                {(passage.comment || '').split('\n').map((e) => (
                  <p>{e}</p>
                ))}
              </div>
              <div className="small">Créé par {users.find((e) => e._id === passage.user)?.name}</div>
              <TagTeam teamId={passage.team} />
            </td>
          </tr>
        );
      })}
    </>
  );
}

function Rencontres({ rencontres, personId }) {
  const users = useRecoilValue(usersState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const [rencontreToEdit, setRencontreToEdit] = useState(null);
  return (
    <>
      <ButtonCustom
        className="tw-mb-4"
        title="Ajouter une rencontre"
        onClick={() =>
          setRencontreToEdit({
            user: user._id,
            team: currentTeam._id,
            person: personId,
          })
        }
      />
      <Rencontre rencontre={rencontreToEdit} onFinished={() => setRencontreToEdit(null)} />
      {(rencontres || []).map((rencontre) => {
        return (
          <tr onClick={(passage) => setRencontreToEdit(passage)}>
            <td>
              <div>{formatDateTimeWithNameOfDay(rencontre.date || rencontre.createdAt)}</div>
              <div className="content">
                {(rencontre.comment || '').split('\n').map((e) => (
                  <p>{e}</p>
                ))}
              </div>
              <div className="small">Créé par {users.find((e) => e._id === rencontre.user)?.name}</div>
              <TagTeam teamId={rencontre.team} />
            </td>
          </tr>
        );
      })}
    </>
  );
}

const Container = styled.div`
  .content {
    overflow-wrap: anywhere;
  }
`;
