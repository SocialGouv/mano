import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Passage from '../../../components/Passage';
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

export const PassagesReport = ({ passages, period, selectedTeams }) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <section title="Passages" className="noprint tw-relative tw-m-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-main">
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-2xl tw-font-semibold tw-text-white">{passages.length}</p>
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-sm tw-font-normal tw-text-white">passage{passages.length > 1 ? 's' : ''}</p>
        <button
          title="Passer les passages en plein écran"
          className="tw-absolute -tw-top-1.5 -tw-right-1.5 tw-h-6 tw-w-6 tw-rounded-full tw-text-white tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30"
          onClick={() => setFullScreen(true)}>
          <FullScreenIcon />
        </button>
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
        <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
          <h3 className="tw-m-0 tw-text-base tw-font-medium">Passages ({passages.length})</h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <PassagesTable passages={passages} period={period} selectedTeams={selectedTeams} />
        </div>
      </section>
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Passages (${passages.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <PassagesTable passages={passages} period={period} selectedTeams={selectedTeams} />
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

const PassagesTable = ({ period, passages, selectedTeams }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const [passageToEdit, setPassageToEdit] = useState(null);

  const numberOfAnonymousPassages = useMemo(() => passages.filter((p) => !p.person)?.length, [passages]);
  const numberOfNonAnonymousPassages = useMemo(() => passages.filter((p) => !!p.person)?.length, [passages]);

  return (
    <>
      <div className="tw-py-2 tw-px-4 print:tw-mb-4 print:tw-px-0">
        <div className="noprint tw-mb-5 tw-flex tw-justify-between">
          <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-xl tw-font-medium tw-text-black">Passages</h3>
          <button
            type="button"
            className="button-submit tw-ml-auto tw-mb-2.5"
            onClick={() =>
              setPassageToEdit({
                date: dayjs(period.startDate),
                user: user._id,
                team: selectedTeams?.length === 1 ? selectedTeams[0]._id : currentTeam._id,
              })
            }>
            Ajouter un passage
          </button>
        </div>
        <div className="tw-mb-4 tw-flex tw-justify-around">
          <div className="tw-basis-1/4">
            <Card
              countId="report-passages-anonymous-count"
              title="Nombre de passages anonymes"
              count={numberOfAnonymousPassages}
              unit={`passage${numberOfAnonymousPassages > 1 ? 's' : ''}`}
            />
          </div>
          <div className="tw-basis-1/4">
            <Card
              countId="report-passages-non-anonymous-count"
              title="Nombre de passages non-anonymes"
              count={numberOfNonAnonymousPassages}
              unit={`passage${numberOfNonAnonymousPassages > 1 ? 's' : ''}`}
            />
          </div>
        </div>
        <Passage passage={passageToEdit} personId={passageToEdit?.person} onFinished={() => setPassageToEdit(null)} />
        {!!passages.length && (
          <Table
            className="Table"
            onRowClick={setPassageToEdit}
            data={passages}
            rowKey={'_id'}
            columns={[
              {
                title: 'Date',
                dataKey: 'date',
                render: (passage) => {
                  // anonymous comment migrated from `report.passages`
                  // have no time
                  // have no user assigned either
                  const time = dayjs(passage.date).format('D MMM HH:mm');
                  return (
                    <>
                      <DateBloc date={passage.date} />
                      <span className="tw-mb-2 tw-block tw-w-full tw-text-center tw-opacity-50">
                        {time === '00:00' && !passage.user ? null : time}
                      </span>
                    </>
                  );
                },
              },
              {
                title: 'Personne suivie',
                dataKey: 'person',
                render: (passage) =>
                  passage.person ? <PersonName showOtherNames item={passage} /> : <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Anonyme</span>,
              },
              {
                title: 'Enregistré par',
                dataKey: 'user',
                render: (passage) => (passage.user ? <UserName id={passage.user} /> : null),
              },
              { title: 'Commentaire', dataKey: 'comment' },
              {
                title: 'Équipe en charge',
                dataKey: 'team',
                render: (passage) => <TagTeam teamId={passage?.team} />,
              },
            ]}
          />
        )}
      </div>
    </>
  );
};
