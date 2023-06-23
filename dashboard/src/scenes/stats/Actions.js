import React, { useMemo, useState } from 'react';
import { CustomResponsiveBar } from './charts';
import { mappedIdsToLabels } from '../../recoil/actions';
import SelectCustom from '../../components/SelectCustom';
import { getMultichoiceBarData } from './utils';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../components/tailwind/Modal';
import ActionsSortableList from '../../components/ActionsSortableList';
import Filters from '../../components/Filters';

const ActionsStats = ({
  // data
  actionsWithDetailedGroupAndCategories,
  // filter by status
  setActionsStatuses,
  actionsStatuses,
  // filter by group
  setActionsCategoriesGroups,
  actionsCategoriesGroups,
  groupsCategories,
  // filter by category
  setActionsCategories,
  actionsCategories,
  filterableActionsCategories,
  // filter by persons
  filterBase,
  filterPersons,
  setFilterPersons,
  personsWithActions,
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

  const filterTitle = useMemo(() => {
    if (!filterPersons.length) {
      if (personsWithActions === 1) return `Filtrer par personnes suivies (${personsWithActions} personne concernée sans filtre) :`;
      return `Filtrer par personnes suivies (${personsWithActions} personnes concernées sans filtre) :`;
    }
    if (personsWithActions === 1) return `Filtrer par personnes suivies (${personsWithActions} personne concernée par le filtre actuel) :`;
    return `Filtrer par personnes suivies (${personsWithActions} personnes concernées par le filtre actuel) :`;
  }, [filterPersons, personsWithActions]);

  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des actions</h3>
      <div className="tw-flex tw-basis-full tw-items-center">
        <Filters title={filterTitle} base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      </div>
      <div className="tw-mb-5 tw-flex tw-basis-full tw-items-center">
        <label htmlFor="filter-by-status" className="tw-w-64 tw-shrink-0">
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
        <label htmlFor="filter-by-status" className="tw-w-64 tw-shrink-0">
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
        <label htmlFor="filter-by-status" className="tw-w-64 tw-shrink-0">
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

      <CustomResponsiveBar
        title="Répartition des actions par groupe"
        help={`Si une action a plusieurs catégories appartenant à plusieurs groupes, elle est comptabilisée dans chaque groupe.\n\nSi une action a plusieurs catégories appartenant au même groupe, elle est comptabilisée autant de fois dans ce groupe.\n\nAinsi, le total affiché peut être supérieur au nombre total d'actions.`}
        onItemClick={(newGroupSlice) => {
          setActionsModalOpened(true);
          setGroupSlice(newGroupSlice);
        }}
        isMultiChoice
        axisTitleY="Actions"
        axisTitleX="Groupe"
        data={getMultichoiceBarData(actionsWithDetailedGroupAndCategories, 'categoryGroup', {
          options: groupsCategories.map((group) => group.groupTitle),
          debug: true,
        })}
        // here we decide that the total is NOT the total of actions
        // but the total of actions splitted by category
        totalForMultiChoice={actionsWithDetailedGroupAndCategories.length}
        totalTitleForMultiChoice={<span className="tw-font-bold">Total</span>}
      />
      <CustomResponsiveBar
        title="Répartition des actions par catégorie"
        help={`Si une action a plusieurs catégories, elle est comptabilisée dans chaque catégorie.\n\nAinsi, le total affiché peut être supérieur au nombre total d'actions.`}
        onItemClick={(newCategorySlice) => {
          setActionsModalOpened(true);
          setCategorySlice(newCategorySlice);
        }}
        isMultiChoice
        axisTitleY="Actions"
        axisTitleX="Catégorie"
        data={getMultichoiceBarData(actionsWithDetailedGroupAndCategories, 'category')}
        // here we decide that the total is NOT the total of actions
        // but the total of actions splitted by category
        totalForMultiChoice={actionsWithDetailedGroupAndCategories.length}
        totalTitleForMultiChoice={<span className="tw-font-bold">Total</span>}
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
