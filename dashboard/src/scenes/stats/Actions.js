import React from 'react';
import { CustomResponsivePie } from './charts';
import { mappedIdsToLabels } from '../../recoil/actions';
import SelectCustom from '../../components/SelectCustom';
import { getPieData } from './utils';

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
        data={getPieData(actionsWithDetailedGroupAndCategories, 'group', { options: groupsCategories.map((group) => group.groupTitle) })}
        onItemClick={console.log}
      />
      <CustomResponsivePie
        title="Répartition des actions par catégorie"
        data={getPieData(actionsWithDetailedGroupAndCategories, 'category', { options: allCategories })}
        field="category"
      />
    </>
  );
};

export default ActionsStats;
