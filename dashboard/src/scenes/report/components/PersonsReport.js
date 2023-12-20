import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useHistory } from 'react-router-dom';
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from '../../../components/tailwind/Modal';
import { FullScreenIcon } from '../../../assets/icons/FullScreenIcon';
import Table from '../../../components/table';
import UserName from '../../../components/UserName';
import TagTeam from '../../../components/TagTeam';
import PersonName from '../../../components/PersonName';
import DateBloc from '../../../components/DateBloc';
import { useLocalStorage } from '../../../services/useLocalStorage';

export const PersonsReport = ({ personsCreated, period, selectedTeams }) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <section title="Personnes créées" className="tw-relative tw-m-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-main">
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-2xl tw-font-semibold tw-text-white">{personsCreated.length}</p>
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-sm tw-font-normal tw-text-white">
          personne{personsCreated.length > 1 ? 's' : ''} créée{personsCreated.length > 1 ? 's' : ''}
        </p>
        <button
          title="Passer les personnes créées en plein écran"
          className="tw-absolute -tw-top-1.5 -tw-right-1.5 tw-h-6 tw-w-6 tw-rounded-full tw-text-white tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30"
          onClick={() => setFullScreen(true)}>
          <FullScreenIcon />
        </button>
      </section>
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Personnes créées (${personsCreated.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <PersonsTable personsCreated={personsCreated} period={period} selectedTeams={selectedTeams} />
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

const PersonsTable = ({ period, personsCreated, selectedTeams }) => {
  const [sortBy, setPersonSortBy] = useLocalStorage('person-sortBy', 'name');
  const [sortOrder, setPersonSortOrder] = useLocalStorage('person-sortOrder', 'ASC');
  const history = useHistory();

  return (
    <>
      <div className="tw-py-2 tw-px-4 print:tw-mb-4">
        <div className="tw-mb-5 tw-flex tw-justify-between">
          <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-xl tw-font-medium tw-text-black">Personnes créées</h3>
        </div>
        {!!personsCreated.length && (
          <Table
            className="Table"
            onRowClick={(person) => {
              if (person) history.push(`/person/${person._id}`);
            }}
            data={personsCreated}
            rowKey={'_id'}
            columns={[
              {
                title: 'Date',
                dataKey: 'date',
                render: (person) => {
                  return (
                    <>
                      <DateBloc date={person.createdAt} />
                      <span className="tw-mb-2 tw-block tw-w-full tw-text-center tw-opacity-50">{dayjs(person.createdAt).format('HH:mm')}</span>
                    </>
                  );
                },
              },
              {
                title: 'Personne (nom)',
                dataKey: 'name',
                onSortOrder: setPersonSortOrder,
                onSortBy: setPersonSortBy,
                sortOrder,
                sortBy,
                render: (person) => <PersonName showOtherNames item={{ person: person._id }} />,
              },
              {
                title: 'Utilisateur (créateur)',
                dataKey: 'user',
                onSortOrder: setPersonSortOrder,
                onSortBy: setPersonSortBy,
                sortOrder,
                sortBy,
                render: (p) => <UserName id={p.user} />,
              },
              {
                title: 'Équipe en charge',
                dataKey: 'assignedTeams',
                render: (person) => (
                  <React.Fragment>
                    {person.assignedTeams?.map((teamId) => (
                      <TagTeam key={teamId} teamId={teamId} />
                    ))}
                  </React.Fragment>
                ),
              },
            ]}
          />
        )}
      </div>
    </>
  );
};
