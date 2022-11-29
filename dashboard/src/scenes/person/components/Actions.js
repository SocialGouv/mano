import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { organisationState, userState } from '../../../recoil/auth';
import { mappedIdsToLabels } from '../../../recoil/actions';
import { filteredPersonActionsSelector } from '../selectors/selectors';
import { useHistory } from 'react-router-dom';
import CreateActionModal from '../../../components/CreateActionModal';
import SelectCustom from '../../../components/SelectCustom';
import ExclamationMarkButton from '../../../components/tailwind/ExclamationMarkButton';
import ActionStatus from '../../../components/ActionStatus';
import TagTeam from '../../../components/TagTeam';
import ActionOrConsultationName from '../../../components/ActionOrConsultationName';
import { formatDateTimeWithNameOfDay, formatDateWithNameOfDay } from '../../../services/date';

export const Actions = ({ person }) => {
  const data = person?.actions || [];
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const catsSelect = ['-- Aucune --', ...(organisation.categories || [])];
  const filteredData = useRecoilValue(filteredPersonActionsSelector({ personId: person._id, filterCategories, filterStatus }));

  return (
    <div className="tw-relative">
      <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
        <h4 className="tw-flex-1">Actions</h4>
        <div>
          <button
            aria-label="Ajouter une action"
            className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
            onClick={() => setModalOpen(true)}>
            ＋
          </button>
        </div>
        <CreateActionModal person={person._id} open={modalOpen} setOpen={(value) => setModalOpen(value)} />
      </div>
      {data.length ? (
        <div className="tw-mb-4 tw-grid tw-grid-cols-2 tw-gap-2 tw-px-3">
          <div>
            <label htmlFor="action-select-categories-filter">Filtrer par catégorie</label>
            <SelectCustom
              options={catsSelect}
              inputId="action-select-categories-filter"
              name="categories"
              onChange={(c) => {
                setFilterCategories(c);
              }}
              isClearable
              isMulti
              getOptionValue={(c) => c}
              getOptionLabel={(c) => c}
            />
          </div>
          <div>
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

      <table className="table table-striped">
        <tbody className="small">
          {filteredData.map((action, i) => (
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
                      {action.urgent ? <ExclamationMarkButton /> : null}{' '}
                      {action.dueAt && action.withTime ? formatDateTimeWithNameOfDay(action.dueAt) : formatDateWithNameOfDay(action.dueAt)}
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
                    <div>
                      <TagTeam teamId={action.team} />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
