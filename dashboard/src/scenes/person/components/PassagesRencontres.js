import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import Passage from '../../../components/Passage';
import Rencontre from '../../../components/Rencontre';
import TagTeam from '../../../components/TagTeam';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';
import { currentTeamState, usersState, userState } from '../../../recoil/auth';
import { dayjsInstance, formatDateTimeWithNameOfDay } from '../../../services/date';

export default function PassagesRencontres({ person }) {
  const users = useRecoilValue(usersState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const [passageToEdit, setPassageToEdit] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [rencontreToEdit, setRencontreToEdit] = useState(null);
  const [selected, setSelected] = useState('passages');
  const personPassages = useMemo(
    () => [...(person?.passages || [])].sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1)),
    [person]
  );
  const personRencontres = useMemo(
    () => [...(person?.rencontres || [])].sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1)),
    [person]
  );
  const handleAddPassage = () => {
    setPassageToEdit({
      user: user._id,
      team: currentTeam._id,
      person: person._id,
    });
    setRencontreToEdit(null);
  };
  const handleAddRencontre = () => {
    setRencontreToEdit({
      user: user._id,
      team: currentTeam._id,
      person: person._id,
    });
    setPassageToEdit(null);
  };
  return (
    <div className="tw-relative">
      <div className="tw-sticky tw-top-0 tw-z-50 tw-mb-3 tw-flex tw-bg-white tw-px-3 tw-pt-3 tw-text-main">
        <div className="tw-flex tw-flex-1">
          <button
            className={
              selected === 'passages'
                ? 'tw-rounded-t tw-border-t tw-border-l tw-border-r tw-border-slate-300 tw-p-1.5'
                : 'tw-border-b tw-border-slate-300 tw-p-1.5'
            }
            onClick={() => setSelected('passages')}>
            Passages ({personPassages.length})
          </button>
          <button
            className={
              selected === 'rencontres'
                ? 'tw-rounded-t tw-border-t tw-border-l tw-border-r tw-border-slate-300 tw-p-1.5'
                : 'tw-border-b tw-border-slate-300 tw-p-1.5'
            }
            onClick={() => setSelected('rencontres')}>
            Rencontres ({personRencontres.length})
          </button>
        </div>
        <div className="flex-col tw-flex tw-items-center tw-gap-2">
          <button
            className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
            onClick={() => {
              if (selected === 'rencontres') handleAddRencontre();
              else handleAddPassage();
            }}>
            ＋
          </button>
          {(selected === 'passages' ? Boolean(personPassages.length) : Boolean(personRencontres.length)) && (
            <button className="tw-h-6 tw-w-6 tw-rounded-full tw-text-main tw-transition hover:tw-scale-125" onClick={() => setFullScreen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path
                  fillRule="evenodd"
                  d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-3.97 3.97a.75.75 0 11-1.06-1.06l3.97-3.97h-2.69a.75.75 0 01-.75-.75zm-12 0A.75.75 0 013.75 3h4.5a.75.75 0 010 1.5H5.56l3.97 3.97a.75.75 0 01-1.06 1.06L4.5 5.56v2.69a.75.75 0 01-1.5 0v-4.5zm11.47 11.78a.75.75 0 111.06-1.06l3.97 3.97v-2.69a.75.75 0 011.5 0v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.69l-3.97-3.97zm-4.94-1.06a.75.75 0 010 1.06L5.56 19.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <ModalContainer open={!!fullScreen} size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Passages de  ${person?.name} (${personPassages.length})`}></ModalHeader>
        <ModalBody>
          {selected === 'passages' ? (
            <PassagesTable personPassages={personPassages} setPassageToEdit={setPassageToEdit} users={users} />
          ) : (
            <RencontresTable personRencontres={personRencontres} setRencontreToEdit={setRencontreToEdit} users={users} />
          )}
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            className="button-submit"
            onClick={() => {
              if (selected === 'rencontres') handleAddRencontre();
              else handleAddPassage();
            }}>
            ＋ Ajouter un commentaire
          </button>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
      <Rencontre rencontre={rencontreToEdit} onFinished={() => setRencontreToEdit(null)} />
      <Passage passage={passageToEdit} onFinished={() => setPassageToEdit(null)} />
      {selected === 'passages' && !personPassages.length && (
        <div className="tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="tw-mx-auto tw-mb-2 tw-h-16 tw-w-16 tw-text-gray-200"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <circle cx={12} cy={12} r={9}></circle>
            <polyline points="12 7 12 12 15 15"></polyline>
          </svg>
          Aucun passage
        </div>
      )}
      {selected === 'rencontres' && !personRencontres.length && (
        <div className="tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="tw-mx-auto tw-mb-2 tw-h-16 tw-w-16 tw-text-gray-200"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <circle cx={12} cy={12} r={9}></circle>
            <polyline points="12 7 12 12 15 15"></polyline>
          </svg>
          Aucune rencontre
        </div>
      )}
      {selected === 'passages' ? (
        <PassagesTable personPassages={personPassages} setPassageToEdit={setPassageToEdit} users={users} />
      ) : (
        <RencontresTable personRencontres={personRencontres} setRencontreToEdit={setRencontreToEdit} users={users} />
      )}
    </div>
  );
}

function PassagesTable({ personPassages, setPassageToEdit, users }) {
  return (
    <table className="table table-striped">
      <tbody className="small">
        {(personPassages || []).map((passage) => {
          return (
            <tr
              key={passage._id}
              onClick={() => {
                setPassageToEdit(passage);
              }}>
              <td>
                <div>{formatDateTimeWithNameOfDay(passage.date || passage.createdAt)}</div>
                <div style={{ overflowWrap: 'anywhere' }}>
                  {(passage.comment || '').split('\n').map((e, i) => (
                    <p key={e + i}>{e}</p>
                  ))}
                </div>
                <div className="small">Créé par {users.find((e) => e._id === passage.user)?.name}</div>
                <div className="tw-max-w-fit">
                  <TagTeam teamId={passage.team} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RencontresTable({ personRencontres, setRencontreToEdit, users }) {
  return (
    <table className="table table-striped">
      <tbody className="small">
        {(personRencontres || []).map((rencontre) => {
          return (
            <tr key={rencontre._id} onClick={() => setRencontreToEdit(rencontre)}>
              <td>
                <div>{formatDateTimeWithNameOfDay(rencontre.date || rencontre.createdAt)}</div>
                <div style={{ overflowWrap: 'anywhere' }}>
                  {(rencontre.comment || '').split('\n').map((e, i) => (
                    <p key={e + i}>{e}</p>
                  ))}
                </div>
                <div className="small">Créé par {users.find((e) => e._id === rencontre.user)?.name}</div>
                <div className="tw-max-w-fit">
                  <TagTeam teamId={rencontre.team} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
