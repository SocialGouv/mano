import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useRecoilValue } from 'recoil';
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from '../../../components/tailwind/Modal';
import { FullScreenIcon } from '../../../assets/icons/FullScreenIcon';
import Table from '../../../components/table';
import TagTeam from '../../../components/TagTeam';
import DateBloc from '../../../components/DateBloc';
import CreateObservation from '../../../components/CreateObservation';
import Observation from '../../territory-observations/view';
import { territoriesState } from '../../../recoil/territory';

export const ObservationsReport = ({ observations, period, selectedTeams }) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <section title="Observations" className="tw-relative tw-m-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-main">
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-2xl tw-font-semibold tw-text-white">{observations.length}</p>
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-sm tw-font-normal tw-text-white">observation{observations.length > 1 ? 's' : ''}</p>
        <button
          title="Passer les observations en plein écran"
          className="tw-absolute -tw-top-1.5 -tw-right-1.5 tw-h-6 tw-w-6 tw-rounded-full tw-text-white tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30"
          onClick={() => setFullScreen(true)}>
          <FullScreenIcon />
        </button>
      </section>
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Observations (${observations.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <ObservationsTable observations={observations} period={period} selectedTeams={selectedTeams} />
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

const ObservationsTable = ({ period, observations, selectedTeams }) => {
  const [observationToEdit, setObservationToEdit] = useState({});
  const [openObservationModaleKey, setOpenObservationModaleKey] = useState(0);
  const territories = useRecoilValue(territoriesState);

  return (
    <>
      <div className="tw-py-2 tw-px-4 print:tw-mb-4">
        <div className="tw-mb-5 tw-flex tw-justify-between">
          <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-2xl tw-font-medium tw-text-black">Observations</h3>
          <button
            type="button"
            className="button-submit tw-ml-auto tw-mb-2.5"
            onClick={() => {
              setObservationToEdit({
                date: dayjs(period.startDate),
                observations: [],
              });
              setOpenObservationModaleKey((k) => k + 1);
            }}>
            Ajouter une observation
          </button>
        </div>
        {!!observations.length && (
          <Table
            className="Table"
            data={observations}
            onRowClick={(obs) => {
              setObservationToEdit(obs);
              setOpenObservationModaleKey((k) => k + 1);
            }}
            rowKey={'_id'}
            columns={[
              {
                title: 'Date',
                dataKey: 'observedAt',
                render: (obs) => {
                  // anonymous comment migrated from `report.observations`
                  // have no time
                  // have no user assigned either
                  const time = dayjs(obs.observedAt).format('D MMM HH:mm');
                  return (
                    <>
                      <DateBloc date={obs.observedAt} />
                      <span className="tw-mb-2 tw-block tw-w-full tw-text-center tw-opacity-50">{time === '00:00' && !obs.user ? null : time}</span>
                    </>
                  );
                },
              },
              { title: 'Territoire', dataKey: 'territory', render: (obs) => territories.find((t) => t._id === obs.territory)?.name },
              { title: 'Observation', dataKey: 'entityKey', render: (obs) => <Observation noTeams noBorder obs={obs} />, left: true },
              {
                title: 'Équipe en charge',
                dataKey: 'team',
                render: (obs) => <TagTeam teamId={obs?.team} />,
              },
            ]}
          />
        )}
      </div>
      <CreateObservation observation={observationToEdit} forceOpen={!!openObservationModaleKey} />
    </>
  );
};
