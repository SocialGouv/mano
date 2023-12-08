import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from '../../../components/tailwind/Modal';
import { FullScreenIcon } from '../../../assets/icons/FullScreenIcon';
import Table from '../../../components/table';
import { currentTeamState, userState } from '../../../recoil/auth';
import { useRecoilValue } from 'recoil';
import UserName from '../../../components/UserName';
import TagTeam from '../../../components/TagTeam';
import PersonName from '../../../components/PersonName';
import DateBloc from '../../../components/DateBloc';
import Card from '../../../components/Card';
import Rencontre from '../../../components/Rencontre';

export const RencontresReport = ({ rencontres, period, selectedTeams }) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <section title="Rencontres" className="tw-relative tw-m-2 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-bg-white tw-px-3 tw-pt-1 tw-pb-3">
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-6xl tw-text-main">{rencontres.length}</p>
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-xl tw-text-main">rencontre{rencontres.length > 1 ? 's' : ''}</p>
        <button
          title="Passer les rencontres en plein écran"
          className="tw-absolute tw-top-2 tw-right-2 tw-h-6 tw-w-6 tw-rounded-full tw-text-main tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30"
          onClick={() => setFullScreen(true)}>
          <FullScreenIcon />
        </button>
      </section>
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Rencontres (${rencontres.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <RencontresTable rencontres={rencontres} period={period} selectedTeams={selectedTeams} />
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

const RencontresTable = ({ period, rencontres, selectedTeams }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const [rencontreToEdit, setRencontreToEdit] = useState(null);

  const numberOfNonAnonymousRencontres = useMemo(() => rencontres.filter((p) => !!p.person)?.length, [rencontres]);

  return (
    <>
      <div className="tw-py-2 tw-px-4 print:tw-mb-4">
        <div className="tw-mb-5 tw-flex tw-justify-between">
          <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-2xl tw-font-medium tw-text-black">Rencontres</h3>
          <button
            type="button"
            className="button-submit tw-ml-auto tw-mb-2.5"
            onClick={() =>
              setRencontreToEdit({
                date: dayjs(period.startDate),
                user: user._id,
                team: selectedTeams?.length === 1 ? selectedTeams[0]._id : currentTeam._id,
              })
            }>
            Ajouter une rencontre
          </button>
        </div>
        <div className="tw-mb-4 tw-flex tw-justify-around">
          <div className="tw-basis-1/4">
            <Card
              countId="report-rencontres-non-anonymous-count"
              title="Nombre de rencontres"
              count={numberOfNonAnonymousRencontres}
              unit={`rencontre${numberOfNonAnonymousRencontres > 1 ? 's' : ''}`}
            />
          </div>
        </div>
        <Rencontre rencontre={rencontreToEdit} personId={rencontreToEdit?.person} onFinished={() => setRencontreToEdit(null)} />
        {!!rencontres.length && (
          <Table
            className="Table"
            onRowClick={setRencontreToEdit}
            data={rencontres}
            rowKey={'_id'}
            columns={[
              {
                title: 'Heure',
                dataKey: 'date',
                render: (rencontre) => {
                  // anonymous comment migrated from `report.rencontres`
                  // have no time
                  // have no user assigned either
                  const time = dayjs(rencontre.date).format('D MMM HH:mm');
                  return (
                    <>
                      <DateBloc date={rencontre.date} />
                      <span className="tw-mb-2 tw-block tw-w-full tw-text-center tw-opacity-50">
                        {time === '00:00' && !rencontre.user ? null : time}
                      </span>
                    </>
                  );
                },
              },
              {
                title: 'Personne suivie',
                dataKey: 'person',
                render: (rencontre) =>
                  rencontre.person ? (
                    <PersonName showOtherNames item={rencontre} />
                  ) : (
                    <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Anonyme</span>
                  ),
              },
              {
                title: 'Enregistré par',
                dataKey: 'user',
                render: (rencontre) => (rencontre.user ? <UserName id={rencontre.user} /> : null),
              },
              { title: 'Commentaire', dataKey: 'comment' },
              {
                title: 'Équipe en charge',
                dataKey: 'team',
                render: (rencontre) => <TagTeam teamId={rencontre?.team} />,
              },
            ]}
          />
        )}
      </div>
    </>
  );
};
