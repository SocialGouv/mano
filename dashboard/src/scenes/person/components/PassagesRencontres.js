import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useLocation, useHistory } from 'react-router-dom';
import Passage from '../../../components/Passage';
import Rencontre from '../../../components/Rencontre';
import TagTeam from '../../../components/TagTeam';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';
import { currentTeamState, usersState, userState, organisationState } from '../../../recoil/auth';
import { dayjsInstance, formatDateTimeWithNameOfDay } from '../../../services/date';
import { FullScreenIcon } from '../../../assets/icons/FullScreenIcon';

export default function PassagesRencontres({ person }) {
  const users = useRecoilValue(usersState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const [fullScreen, setFullScreen] = useState(false);
  const [selected, setSelected] = useState(organisation.passagesEnabled ? 'passages' : 'rencontres');
  const history = useHistory();
  const { search } = useLocation();
  const currentPassageId = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return searchParams.get('passageId');
  }, [search]);
  const currentRencontreId = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return searchParams.get('rencontreId');
  }, [search]);

  const personPassages = useMemo(
    () => [...(person?.passages || [])].sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1)),
    [person]
  );
  const personRencontres = useMemo(
    () => [...(person?.rencontres || [])].sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1)),
    [person]
  );
  const handleAddPassage = () => {
    history.push(`/person/${person._id}?passageId=new`);
  };
  const handleAddRencontre = () => {
    history.push(`/person/${person._id}?rencontreId=new`);
  };

  const currentPassage = useMemo(() => {
    if (!currentPassageId) return null;
    if (currentPassageId === 'new') return { person: person._id, user: user._id, team: currentTeam._id };
    return personPassages.find((p) => p._id === currentPassageId);
  }, [currentPassageId, personPassages, person, user, currentTeam]);

  const currentRencontre = useMemo(() => {
    if (!currentRencontreId) return null;
    if (currentRencontreId === 'new') return { person: person._id, user: user._id, team: currentTeam._id };
    return personRencontres.find((p) => p._id === currentRencontreId);
  }, [currentRencontreId, personRencontres, person, user, currentTeam]);

  if (!organisation.passagesEnabled && !organisation.rencontresEnabled) {
    return null;
  }

  return (
    <div className="tw-relative">
      <div className="tw-sticky tw-top-0 tw-z-10 tw-mb-3 tw-flex tw-bg-white tw-p-3 tw-text-main tw-shadow-sm">
        <div className="tw-flex tw-flex-1">
          {organisation.passagesEnabled && (
            <button
              className={
                selected === 'passages'
                  ? 'tw-rounded-t tw-border-t tw-border-l tw-border-r tw-border-slate-300 tw-p-1.5'
                  : 'tw-border-b tw-border-slate-300 tw-p-1.5'
              }
              onClick={() => setSelected('passages')}>
              Passages ({personPassages.length})
            </button>
          )}
          {organisation.rencontresEnabled && (
            <button
              className={
                selected === 'rencontres'
                  ? 'tw-rounded-t tw-border-t tw-border-l tw-border-r tw-border-slate-300 tw-p-1.5'
                  : 'tw-border-b tw-border-slate-300 tw-p-1.5'
              }
              onClick={() => setSelected('rencontres')}>
              Rencontres ({personRencontres.length})
            </button>
          )}
        </div>
        <div className="flex-col tw-flex tw-items-center tw-gap-2">
          <button
            className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
            aria-label={selected === 'passages' ? 'Ajouter un passage' : 'Ajouter une rencontre'}
            onClick={() => {
              if (selected === 'rencontres') handleAddRencontre();
              else handleAddPassage();
            }}>
            ＋
          </button>
          {(selected === 'passages' ? Boolean(personPassages.length) : Boolean(personRencontres.length)) && (
            <button
              title={`Passer les ${selected} en plein écran`}
              className="tw-h-6 tw-w-6 tw-rounded-full tw-text-main tw-transition hover:tw-scale-125"
              onClick={() => setFullScreen(true)}>
              <FullScreenIcon />
            </button>
          )}
        </div>
      </div>
      <ModalContainer open={!!fullScreen} size="prose" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`${selected.capitalize()} de  ${person?.name} (${personPassages.length})`}></ModalHeader>
        <ModalBody>
          {selected === 'passages' ? (
            <PassagesTable personPassages={personPassages} users={users} />
          ) : (
            <RencontresTable personRencontres={personRencontres} users={users} />
          )}
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
          <button
            type="button"
            className="button-submit"
            onClick={() => {
              if (selected === 'rencontres') handleAddRencontre();
              else handleAddPassage();
            }}>
            ＋ Ajouter {selected === 'rencontres' ? 'une rencontre' : 'un passage'}
          </button>
        </ModalFooter>
      </ModalContainer>
      <Rencontre
        rencontre={currentRencontre}
        personId={person._id}
        onFinished={() => {
          history.replace(`/person/${person._id}`);
        }}
      />
      <Passage
        passage={currentPassage}
        personId={person._id}
        onFinished={() => {
          history.replace(`/person/${person._id}`);
        }}
      />
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
        <PassagesTable personPassages={personPassages} users={users} />
      ) : (
        <RencontresTable personRencontres={personRencontres} users={users} />
      )}
    </div>
  );
}

function PassagesTable({ personPassages, users }) {
  const history = useHistory();
  return (
    <table className="table table-striped">
      <tbody className="small">
        {(personPassages || []).map((passage) => {
          return (
            <tr
              key={passage._id}
              onClick={() => {
                history.push(`/person/${passage.person}?passageId=${passage._id}`);
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

function RencontresTable({ personRencontres, users }) {
  const history = useHistory();
  return (
    <table className="table table-striped">
      <tbody className="small">
        {(personRencontres || []).map((rencontre) => {
          return (
            <tr
              key={rencontre._id}
              onClick={() => {
                history.push(`/person/${rencontre.person}?rencontreId=${rencontre._id}`);
              }}>
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
