import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import Passage from '../../../components/Passage';
import Rencontre from '../../../components/Rencontre';
import TagTeam from '../../../components/TagTeam';
import { currentTeamState, usersState, userState } from '../../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../../services/date';

export default function PassagesRencontres({ person }) {
  const { passages, rencontres } = person;
  const users = useRecoilValue(usersState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const [passageToEdit, setPassageToEdit] = useState(null);
  const [rencontreToEdit, setRencontreToEdit] = useState(null);
  const [selected, setSelected] = useState('passages');
  return (
    <Container className="tw-relative">
      <div className="tw-sticky tw-top-0 tw-z-50 tw-mb-3 tw-flex tw-bg-white tw-px-3 tw-pt-3 tw-text-main">
        <div className="tw-flex tw-flex-1">
          <button
            className={
              selected === 'passages'
                ? 'tw-rounded-t tw-border-t tw-border-l tw-border-r tw-border-slate-300 tw-p-2'
                : 'tw-border-b tw-border-slate-300 tw-p-2'
            }
            onClick={() => setSelected('passages')}>
            Passages
          </button>
          <button
            className={
              selected === 'rencontres'
                ? 'tw-rounded-t tw-border-t tw-border-l tw-border-r tw-border-slate-300 tw-p-2'
                : 'tw-border-b tw-border-slate-300 tw-p-2'
            }
            onClick={() => setSelected('rencontres')}>
            Rencontres
          </button>
        </div>
        <div>
          <button
            className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
            onClick={() => {
              if (selected === 'passages') {
                setRencontreToEdit({
                  user: user._id,
                  team: currentTeam._id,
                  person: person._id,
                });
              } else {
                setPassageToEdit({
                  user: user._id,
                  team: currentTeam._id,
                  person: person._id,
                });
              }
            }}>
            ＋
          </button>
        </div>
      </div>
      <Rencontre rencontre={rencontreToEdit} onFinished={() => setRencontreToEdit(null)} />
      <Passage passage={passageToEdit} onFinished={() => setPassageToEdit(null)} />
      <table className="table table-striped">
        <tbody className="small">
          {selected === 'passages'
            ? (passages || []).map((passage) => {
                return (
                  <tr
                    onClick={() => {
                      setPassageToEdit(passage);
                    }}>
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
              })
            : (rencontres || []).map((rencontre) => {
                return (
                  <tr onClick={() => setRencontreToEdit(rencontre)}>
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
        </tbody>
      </table>
    </Container>
  );
}

const Container = styled.div`
  .content {
    overflow-wrap: anywhere;
  }
`;
