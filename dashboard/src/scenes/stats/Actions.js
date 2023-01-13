import React, { useMemo, useState } from 'react';
import { CustomResponsivePie } from './charts';
import { mappedIdsToLabels } from '../../recoil/actions';
import SelectCustom from '../../components/SelectCustom';
import { getPieData } from './utils';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../components/tailwind/Modal';
import ActionsSortableList from '../../components/ActionsSortableList';

const ActionsStats = ({
  setActionsStatuses,
  actionsStatuses,
  setActionsCategories,
  actionsCategories,
  setActionsCategoriesGroups,
  actionsCategoriesGroups,
  groupsCategories,
  filterableActionsCategories,
  actionsWithDetailedGroupAndCategories,
  allCategories,
}) => {
  const [actionsModalOpened, setActionsModalOpened] = useState(false);
  const [groupSlice, setGroupSlice] = useState(null);
  const [categorySlice, setCategorySlice] = useState(null);

  const actionsDataForGroups = useMemo(() => {
    return actionsWithDetailedGroupAndCategories.reduce((actions, action) => {
      if (!actions.find((a) => a._id === action._id)) {
        return [...actions, action];
      }
      return actions;
    }, []);
  }, [actionsWithDetailedGroupAndCategories]);

  const filteredActionsBySlice = useMemo(() => {
    if (groupSlice) {
      return actionsDataForGroups.reduce((actions, action) => {
        if (action.group === groupSlice && !actions.find((a) => a._id === action._id)) {
          return [...actions, action];
        }
        return actions;
      }, []);
    }
    if (categorySlice) {
      return actionsWithDetailedGroupAndCategories.reduce((actions, action) => {
        if (action.categories.includes(categorySlice) && !actions.find((a) => a._id === action._id)) {
          return [...actions, action];
        }
        return actions;
      }, []);
    }
    return [];
  }, [actionsDataForGroups, actionsWithDetailedGroupAndCategories, groupSlice, categorySlice]);

  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des actions</h3>
      <div className="tw-mb-5 tw-flex tw-basis-full tw-items-center">
        <label htmlFor="filter-by-status" className="tw-mx-5 tw-w-64 tw-shrink-0">
          Filtrer par statut :
        </label>
        <div className="tw-basis-[500px]">
          <SelectCustom
            inputId="action-select-status-filter"
            options={mappedIdsToLabels}
            getOptionValue={(s) => s._id}
            getOptionLabel={(s) => s.name}
            name="action-status"
            onChange={(s) => setActionsStatuses(s.map((s) => s._id))}
            isClearable
            isMulti
            value={mappedIdsToLabels.filter((s) => actionsStatuses.includes(s._id))}
          />
        </div>
      </div>
      <div className="tw-mb-5 tw-flex tw-basis-full tw-items-center">
        <label htmlFor="filter-by-status" className="tw-mx-5 tw-w-64 tw-shrink-0">
          Filtrer par groupe de catégories :
        </label>
        <div className="tw-basis-[500px]">
          <SelectCustom
            value={actionsCategoriesGroups?.map((_option) => ({ value: _option, label: _option })) || []}
            options={groupsCategories.map((group) => group.groupTitle).map((_option) => ({ value: _option, label: _option }))}
            getOptionValue={(s) => s.value}
            getOptionLabel={(s) => s.label}
            onChange={(groups) => setActionsCategoriesGroups(groups.map((s) => s.value))}
            name="action-category-group"
            inputId="action-select-group-category-filter"
            isClearable
            isMulti
          />
        </div>
      </div>
      <div className="tw-mb-5 tw-flex tw-basis-full tw-items-center">
        <label htmlFor="filter-by-status" className="tw-mx-5 tw-w-64 tw-shrink-0">
          Filtrer par catégorie:
        </label>
        <div className="tw-basis-[500px]">
          <SelectCustom
            options={filterableActionsCategories.map((_option) => ({ value: _option, label: _option }))}
            value={actionsCategories?.map((_option) => ({ value: _option, label: _option })) || []}
            getOptionValue={(s) => s.value}
            getOptionLabel={(s) => s.label}
            onChange={(categories) => setActionsCategories(categories.map((s) => s.value))}
            inputId="action-select-category-filter"
            name="action-category"
            isClearable
            isMulti
          />
        </div>
      </div>
      <CustomResponsivePie
        title="Répartition des actions par groupe"
        data={getPieData(actionsDataForGroups, 'group', { options: groupsCategories.map((group) => group.groupTitle) })}
        onItemClick={(newGroupSlice) => {
          setActionsModalOpened(true);
          setGroupSlice(newGroupSlice);
        }}
      />
      <CustomResponsivePie
        title="Répartition des actions par catégorie"
        data={getPieData(actionsWithDetailedGroupAndCategories, 'category', { options: allCategories })}
        field="category"
        onItemClick={(newCategorySlice) => {
          setActionsModalOpened(true);
          setCategorySlice(newCategorySlice);
        }}
      />
      <SelectedActionsModal
        open={actionsModalOpened}
        onClose={() => {
          setActionsModalOpened(false);
        }}
        onAfterLeave={() => {
          setGroupSlice(null);
          setCategorySlice(null);
        }}
        data={filteredActionsBySlice}
        title={`Actions ${groupSlice !== null ? `du groupe ${groupSlice}` : ''}${categorySlice !== null ? `de la catégorie ${categorySlice}` : ''} (${
          filteredActionsBySlice.length
        })`}
      />
    </>
  );
};

const SelectedActionsModal = ({ open, onClose, data, title, onAfterLeave }) => {
  return (
    <ModalContainer open={open} size="full" onClose={onClose} onAfterLeave={onAfterLeave}>
      <ModalHeader title={title} />
      <ModalBody>
        <div className="tw-p-4">
          <ActionsSortableList data={data} limit={20} />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            onClose(null);
          }}>
          Fermer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default ActionsStats;
