import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { organisationState, userState } from '../../../recoil/auth';
import { CANCEL, DONE, flattenedCategoriesSelector, mappedIdsToLabels } from '../../../recoil/actions';
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

export const Actions = ({ person }) => {
  const data = person?.actions || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const filteredData = useRecoilValue(filteredPersonActionsSelector({ personId: person._id, filterCategories, filterStatus }));

  return (
    <>
      <div className="tw-relative">
        <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
          <h4 className="tw-flex-1">Actions {filteredData.length ? `(${filteredData.length})` : ''}</h4>
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              aria-label="Ajouter une action"
              className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
              onClick={() => setModalOpen(true)}>
              ＋
            </button>
            {Boolean(filteredData.length) && (
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
        <ActionsFilters
          data={data}
          filteredData={filteredData}
          filterCategories={filterCategories}
          setFilterCategories={setFilterCategories}
          setFilterStatus={setFilterStatus}
          filterStatus={filterStatus}
        />
        <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
          <ModalHeader title={`Actions de  ${person?.name} (${filteredData.length})`}>
            <div className="tw-mt-2 tw-w-full tw-max-w-2xl">
              <ActionsFilters
                data={data}
                filteredData={filteredData}
                filterCategories={filterCategories}
                setFilterCategories={setFilterCategories}
                setFilterStatus={setFilterStatus}
                filterStatus={filterStatus}
              />
            </div>
          </ModalHeader>
          <ModalBody>
            <ActionsTable filteredData={filteredData} />
          </ModalBody>
          <ModalFooter>
            <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
              Fermer
            </button>
            <button type="button" className="button-submit" onClick={() => setModalOpen(true)}>
              ＋ Ajouter une action
            </button>
          </ModalFooter>
        </ModalContainer>
        <ActionsTable filteredData={filteredData} />
      </div>
      <CreateActionModal person={person._id} open={modalOpen} setOpen={(value) => setModalOpen(value)} />
    </>
  );
};

const ActionsFilters = ({ data, filteredData, setFilterCategories, setFilterStatus, filterStatus, filterCategories }) => {
  const categories = useRecoilValue(flattenedCategoriesSelector);

  const catsSelect = ['-- Aucune --', ...(categories || [])];

  return (
    <>
      {data.length ? (
        <div className="tw-mb-4 tw-flex tw-basis-full tw-justify-between tw-gap-2 tw-px-3">
          <div className="tw-shrink-0 tw-flex-grow">
            <label htmlFor="action-select-categories-filter">Filtrer par catégorie</label>
            <SelectCustom
              options={catsSelect.map((_option) => ({ value: _option, label: _option }))}
              value={filterCategories?.map((_option) => ({ value: _option, label: _option })) || []}
              getOptionValue={(i) => i.value}
              getOptionLabel={(i) => i.label}
              onChange={(values) => setFilterCategories(values.map((v) => v.value))}
              inputId="action-select-categories-filter"
              name="categories"
              isClearable
              isMulti
            />
          </div>
          <div className="tw-shrink-0 tw-flex-grow">
            <label htmlFor="action-select-status-filter">Filtrer par statut</label>
            <SelectCustom
              inputId="action-select-status-filter"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="status"
              onChange={(s) => setFilterStatus(s.map((s) => s._id))}
              isClearable
              isMulti
              value={mappedIdsToLabels.filter((s) => filterStatus.includes(s._id))}
            />
          </div>
        </div>
      ) : (
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
            <path d="M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4"></path>
            <circle cx={18} cy={18} r={4}></circle>
            <path d="M15 3v4"></path>
            <path d="M7 3v4"></path>
            <path d="M3 11h16"></path>
            <path d="M18 16.496v1.504l1 1"></path>
          </svg>
          Aucune action pour le moment
        </div>
      )}
    </>
  );
};

const ActionsTable = ({ filteredData }) => {
  const history = useHistory();
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

  return (
    <table className="table table-striped">
      <tbody className="small">
        {filteredData.map((action, i) => {
          const date = formatDateWithNameOfDay([DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt);
          const time = action.withTime && action.dueAt ? ` ${formatTime(action.dueAt)}` : '';
          return (
            <tr key={action._id}>
              <td>
                <div
                  className={['restricted-access'].includes(user.role) ? 'tw-cursor-not-allowed tw-py-2' : 'tw-cursor-pointer tw-py-2'}
                  onClick={() => {
                    if (['restricted-access'].includes(user.role)) return;
                    history.push(`/action/${action._id}`);
                  }}>
                  <div className="tw-flex">
                    <div className="tw-flex-1">
                      {action.urgent ? <ExclamationMarkButton /> : null} {`${date}${time}`}
                    </div>
                    <div>
                      <ActionStatus status={action.status} />
                    </div>
                  </div>
                  <div className="tw-mt-2 tw-flex">
                    <div className="tw-flex tw-flex-1 tw-flex-row tw-items-center">
                      {!['restricted-access'].includes(user.role) && (
                        <>
                          {!!organisation.groupsEnabled && !!action.group && (
                            <span className="tw-mr-2 tw-text-xl" aria-label="Action familiale" title="Action familiale">
                              👪
                            </span>
                          )}
                          <ActionOrConsultationName item={action} />
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
