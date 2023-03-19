import React, { useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { organisationState, usersState, userState } from '../../../recoil/auth';
import { useHistory } from 'react-router-dom';
import { formatDateWithFullMonth } from '../../../services/date';
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from '../../../components/tailwind/Modal';
import TreatmentModal from './TreatmentModal';
import { treatmentsState } from '../../../recoil/treatments';
import { AgendaMutedIcon } from './AgendaMutedIcon';
import { FullScreenIcon } from './FullScreenIcon';

export const Treatments = ({ person }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const allTreatments = useRecoilValue(treatmentsState);
  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === person._id), [allTreatments, person._id]);
  const filteredData = treatments;

  return (
    <>
      {modalOpen && <TreatmentModal isNewTreatment person={person} onClose={() => setModalOpen(false)} />}
      <div className="tw-relative">
        <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-bg-white tw-p-3">
          <h4 className="tw-flex-1 tw-text-xl">Traitements {filteredData.length ? `(${filteredData.length})` : ''}</h4>
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              aria-label="Ajouter un traitement"
              className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-blue-900 tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
              onClick={() => setModalOpen(true)}>
              ＋
            </button>
            {Boolean(filteredData.length) && (
              <button className="tw-h-6 tw-w-6 tw-rounded-full tw-text-blue-900 tw-transition hover:tw-scale-125" onClick={() => setFullScreen(true)}>
                <FullScreenIcon />
              </button>
            )}
          </div>
        </div>
        <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
          <ModalHeader title={`Traitements de  ${person?.name} (${filteredData.length})`}></ModalHeader>
          <ModalBody>
            <TreatmentsTable filteredData={filteredData} person={person} />
          </ModalBody>
          <ModalFooter>
            <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
              Fermer
            </button>
            <button type="button" className="button-submit" onClick={() => setModalOpen(true)}>
              ＋ Ajouter un traitement
            </button>
          </ModalFooter>
        </ModalContainer>
        {filteredData.length ? (
          <TreatmentsTable filteredData={filteredData} person={person} />
        ) : (
          <div className="tw-p-4 tw-text-center tw-text-gray-300">
            <AgendaMutedIcon />
            Aucun traitement
          </div>
        )}
      </div>
    </>
  );
};

const TreatmentsTable = ({ filteredData, person }) => {
  const history = useHistory();
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const [treatmentEditOpen, setTreatmentEditOpen] = useState(false);
  const users = useRecoilValue(usersState);

  return (
    <>
      <table className="table">
        <tbody className="small">
          {filteredData.map((treatment, i) => {
            return (
              <tr key={treatment._id} className={i % 2 ? 'tw-bg-slate-50/80' : 'tw-bg-slate-100/80'}>
                <td>
                  <div
                    className={['restricted-access'].includes(user.role) ? 'tw-cursor-not-allowed tw-py-2' : 'tw-cursor-pointer tw-py-2'}
                    onClick={() => {
                      setTreatmentEditOpen(treatment);
                    }}>
                    <div className="tw-flex">
                      <div className="tw-flex tw-flex-1 tw-items-center">
                        <TreatmentDate treatment={treatment} />
                        {Boolean(treatment.documents?.length) && <div className="tw-ml-2 tw-text-xs">{treatment.documents?.length} document(s)</div>}
                      </div>
                      <div>Créé par {treatment.user ? users.find((u) => u._id === treatment.user)?.name : ''}</div>
                    </div>
                    <div className="tw-mt-2">
                      {treatment.name} - {treatment.indication}{' '}
                      <span className="text-muted">
                        ({treatment.dosage} - {treatment.frequency})
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {treatmentEditOpen && <TreatmentModal treatment={treatmentEditOpen} person={person} onClose={() => setTreatmentEditOpen(false)} />}
    </>
  );
};

function TreatmentDate({ treatment }) {
  if (!!treatment.endDate) {
    return (
      <p className="tw-m-0">
        Du {formatDateWithFullMonth(treatment.startDate)} au {formatDateWithFullMonth(treatment.endDate)}
      </p>
    );
  }
  return <p className="tw-m-0">À partir du {formatDateWithFullMonth(treatment.startDate)}</p>;
}
