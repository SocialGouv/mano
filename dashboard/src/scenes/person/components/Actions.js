import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { organisationState } from '../../../recoil/auth';
import { mappedIdsToLabels } from '../../../recoil/actions';
import { filteredPersonActionsSelector } from '../selectors/selectors';
import { useHistory } from 'react-router-dom';
import CreateActionModal from '../../../components/CreateActionModal';
import SelectCustom from '../../../components/SelectCustom';
import ExclamationMarkButton from '../../../components/ExclamationMarkButton';
import ActionStatus from '../../../components/ActionStatus';
import TagTeam from '../../../components/TagTeam';
import ActionName from '../../../components/ActionName';

export const Actions = ({ person }) => {
  const data = person?.actions || [];
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);
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
      ) : null}

      <table className="table table-striped">
        <tbody className="small">
          {filteredData.map((action, i) => (
            <tr>
              <td>
                <div
                  className="tw-cursor-pointer tw-py-2"
                  onClick={() => {
                    history.push(`/action/${action._id}`);
                  }}>
                  <div className="tw-flex">
                    <div className="tw-flex-1">{action.urgent ? <ExclamationMarkButton /> : null} Vendredi 29 Septembre 22:30</div>
                    <div>
                      <ActionStatus status={action.status} />
                    </div>
                  </div>
                  <div className="tw-mt-2 tw-flex">
                    <div className="tw-flex-1">
                      <ActionName action={action} />
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
