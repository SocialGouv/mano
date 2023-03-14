import React, { useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { organisationState, usersState, userState } from '../../../recoil/auth';
import { CANCEL, DONE, flattenedCategoriesSelector, mappedIdsToLabels, sortActionsOrConsultations } from '../../../recoil/actions';
import { filteredPersonActionsSelector } from '../selectors/selectors';
import { useHistory } from 'react-router-dom';
import CreateActionModal from '../../../components/CreateActionModal';
import SelectCustom from '../../../components/SelectCustom';
import ExclamationMarkButton from '../../../components/tailwind/ExclamationMarkButton';
import ActionStatus from '../../../components/ActionStatus';
import TagTeam from '../../../components/TagTeam';
import ActionOrConsultationName from '../../../components/ActionOrConsultationName';
import { formatDateWithFullMonth, formatDateWithNameOfDay, formatTime } from '../../../services/date';
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from '../../../components/tailwind/Modal';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { useLocalStorage } from 'react-use';
import TreatmentModal from './TreatmentModal';
import { treatmentsState } from '../../../recoil/treatments';

export const Treatments = ({ person }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);

  const [allTreatments, setAllTreatments] = useRecoilState(treatmentsState);
  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === person._id), [allTreatments, person._id]);
  const filteredData = treatments;

  return (
    <>
      {modalOpen && <TreatmentModal isNewTreatment person={person} onClose={() => setModalOpen(false)} />}
      <div className="tw-relative">
        <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-bg-white tw-p-3">
          <h4 className="tw-flex-1">Traitements {filteredData.length ? `(${filteredData.length})` : ''}</h4>
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              aria-label="Ajouter un traitement"
              className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-blue-900 tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
              onClick={() => setModalOpen(true)}>
              ＋
            </button>
            {Boolean(filteredData.length) && (
              <button className="tw-h-6 tw-w-6 tw-rounded-full tw-text-blue-900 tw-transition hover:tw-scale-125" onClick={() => setFullScreen(true)}>
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
        <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
          <ModalHeader title={`Actions de  ${person?.name} (${filteredData.length})`}></ModalHeader>
          <ModalBody>
            <TreatmentsTable filteredData={filteredData} person={person} />
          </ModalBody>
          <ModalFooter>
            <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
              Fermer
            </button>
            <button type="button" className="button-submit" onClick={() => setModalOpen(true)}>
              ＋ Ajouter une consultation
            </button>
          </ModalFooter>
        </ModalContainer>
        <TreatmentsTable filteredData={filteredData} person={person} />
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
            const date = formatDateWithNameOfDay([DONE, CANCEL].includes(treatment.status) ? treatment.completedAt : treatment.dueAt);
            const time = treatment.withTime && treatment.dueAt ? ` ${formatTime(treatment.dueAt)}` : '';
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
                    <div className="tw-mt-2 tw-grid tw-grid-cols-2">
                      <div>
                        <div>{treatment.name}</div>
                        <small className="text-muted">{treatment.indication}</small>
                      </div>
                      <div>
                        <div>{treatment.dosage}</div>
                        <small className="text-muted">{treatment.frequency}</small>
                      </div>
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
