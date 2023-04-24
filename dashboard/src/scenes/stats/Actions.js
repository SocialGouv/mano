import React, { useMemo, useState } from 'react';
import { CustomResponsiveBar, CustomResponsivePie } from './charts';
import { mappedIdsToLabels } from '../../recoil/actions';
import SelectCustom from '../../components/SelectCustom';
import { getMultichoiceBarData, getPieData } from './utils';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../components/tailwind/Modal';
import ActionsSortableList from '../../components/ActionsSortableList';

const ActionsStats = ({
  originalDatasetLength,
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
    const uniqueActionPerGroup = {};
    for (const action of actionsWithDetailedGroupAndCategories) {
      uniqueActionPerGroup[action._id] = action;
    }
    return Object.values(uniqueActionPerGroup);
  }, [actionsWithDetailedGroupAndCategories]);

  const filteredActionsBySlice = useMemo(() => {
    if (groupSlice) {
      const withGroupSlice = {};
      for (const action of actionsDataForGroups) {
        if (groupSlice === 'Non renseigné' && !action.categoryGroup) {
          withGroupSlice[action._id] = action;
        }
        if (action.categoryGroup === groupSlice) {
          withGroupSlice[action._id] = action;
        }
      }
      return Object.values(withGroupSlice);
    }
    if (categorySlice) {
      const withCatSlice = {};
      for (const action of actionsWithDetailedGroupAndCategories) {
        if (categorySlice === 'Non renseigné' && !action.categories?.length) {
          withCatSlice[action._id] = action;
        }
        if (action.categories.includes(categorySlice)) {
          withCatSlice[action._id] = action;
        }
      }
      return Object.values(withCatSlice);
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
        help={`Si une action a plusieurs catégories appartenant à plusieurs groupes, elle est comptabilisée dans chaque groupe.\n\nSi une action a plusieurs catégories appartenant au même groupe, elle est comptabilisée une seule fois dans ce groupe.\n\nAinsi, le total affiché peut être supérieur au nombre total d'actions.`}
        data={getPieData(actionsDataForGroups, 'categoryGroup', { options: groupsCategories.map((group) => group.groupTitle) })}
        onItemClick={(newGroupSlice) => {
          setActionsModalOpened(true);
          setGroupSlice(newGroupSlice);
        }}
      />
      <CustomResponsiveBar
        title="Répartition des actions par catégorie"
        help={`Si une action a plusieurs catégories, elle est comptabilisée dans chaque catégorie.\n\nAinsi, le total affiché peut être supérieur au nombre total d'actions.`}
        onItemClick={(newCategorySlice) => {
          setActionsModalOpened(true);
          setCategorySlice(newCategorySlice);
        }}
        isMultiChoice
        originalDatasetLength={originalDatasetLength}
        axisTitleY="Actions"
        axisTitleX="Catégorie"
        data={getMultichoiceBarData(actionsWithDetailedGroupAndCategories, 'category')}
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
