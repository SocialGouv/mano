import React, { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { organisationState, userState } from '../../../recoil/auth';
import { CANCEL, DONE, flattenedCategoriesSelector, mappedIdsToLabels, sortActionsOrConsultations } from '../../../recoil/actions';
import { filteredPersonActionsSelector } from '../selectors/selectors';
import { useHistory } from 'react-router-dom';
import CreateActionModal from '../../../components/CreateActionModal';
import SelectCustom from '../../../components/SelectCustom';
import ExclamationMarkButton from '../../../components/tailwind/ExclamationMarkButton';
import ActionStatus from '../../../components/ActionStatus';
import TagTeam from '../../../components/TagTeam';
import ActionOrConsultationName from '../../../components/ActionOrConsultationName';
import { formatDateWithNameOfDay, formatTime } from '../../../services/date';
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from '../../../components/tailwind/Modal';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { useLocalStorage } from 'react-use';

export const Treatments = ({ person }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);

  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);
  const [consultationTypes, setConsultationTypes] = useLocalStorage('consultation-types', []);
  const [consultationStatuses, setConsultationStatuses] = useLocalStorage('consultation-statuses', []);

  const personConsultations = useMemo(() => [].filter((c) => c.person === person._id), [allConsultations, person._id]);
  const personConsultationsFiltered = useMemo(
    () =>
      personConsultations
        .filter((c) => !consultationStatuses.length || consultationStatuses.includes(c.status))
        .filter((c) => !consultationTypes.length || consultationTypes.includes(c.type))
        .sort((p1, p2) => ((p1.completedAt || p1.dueAt) > (p2.completedAt || p2.dueAt) ? -1 : 1)),
    [personConsultations, consultationStatuses, consultationTypes]
  );
  const data = personConsultations;
  const filteredData = personConsultationsFiltered;

  return (
    <>
      <div className="tw-relative">
        <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-bg-white tw-p-3">
          <h4 className="tw-flex-1">Traitements {filteredData.length ? `(${filteredData.length})` : ''}</h4>
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              aria-label="Ajouter une action"
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
            <ConsltationsTable filteredData={filteredData} />
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
        <ConsltationsTable filteredData={filteredData} />
      </div>
      <CreateActionModal person={person._id} open={modalOpen} setOpen={(value) => setModalOpen(value)} />
    </>
  );
};

const ConsltationsTable = ({ filteredData }) => {
  const history = useHistory();
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

  return (
    <table className="table">
      <tbody className="small">
        {filteredData.map((action, i) => {
          const date = formatDateWithNameOfDay([DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt);
          const time = action.withTime && action.dueAt ? ` ${formatTime(action.dueAt)}` : '';
          return (
            <tr key={action._id} className={i % 2 ? 'tw-bg-sky-800/80 tw-text-white' : 'tw-bg-sky-100/80'}>
              <td>
                <div
                  className={['restricted-access'].includes(user.role) ? 'tw-cursor-not-allowed tw-py-2' : 'tw-cursor-pointer tw-py-2'}
                  onClick={() => {
                    if (['restricted-access'].includes(user.role)) return;
                    history.push(`/action/${action._id}`);
                  }}>
                  <div className="tw-flex">
                    <div className="tw-flex-1">{`${date}${time}`}</div>
                    <div>
                      <ActionStatus status={action.status} />
                    </div>
                  </div>
                  <div className="tw-mt-2 tw-flex">
                    <div className="tw-flex tw-flex-1 tw-flex-row tw-items-center">
                      {!['restricted-access'].includes(user.role) && (
                        <>
                          <ActionOrConsultationName item={action} hideType />
                          {Boolean(action.name) && ![action.type, `Consultation ${action.type}`].includes(action.name) && (
                            <span className="tw-ml-2">- {action.type}</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="tw-flex tw-flex-col tw-gap-px">
                      {Array.isArray(action?.teams) ? action.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={action?.team} />}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
