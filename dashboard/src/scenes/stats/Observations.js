import React from 'react';
import SelectCustom from '../../components/SelectCustom';
import CustomFieldsStats from './CustomFieldsStats';

const ObservationsStats = ({ territories, setSelectedTerritories, observations, customFieldsObs }) => {
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des observations de territoire</h3>
      <div className="tw-mx-5 tw-mb-8">
        <label htmlFor="filter-territory">Filter par territoire</label>
        <SelectCustom
          isMulti
          options={territories}
          name="place"
          placeholder="Tous les territoires"
          onChange={(t) => {
            setSelectedTerritories(t);
          }}
          isClearable={true}
          inputId="filter-territory"
          getOptionValue={(i) => i._id}
          getOptionLabel={(i) => i.name}
        />
      </div>
      <CustomFieldsStats
        data={observations}
        customFields={customFieldsObs}
        dataTestId="number-observations"
        additionalCols={[
          {
            title: "Nombre d'observations de territoire",
            value: observations.length,
          },
        ]}
        help={(label) =>
          `${label.capitalize()} des observations des territoires sélectionnés, dans la période définie.\n\nLa moyenne de cette données est basée sur le nombre d'observations faites.`
        }
        totalTitleForMultiChoice={
          <>
            <span className="tw-font-bold">Total d'observations uniques</span> <br />{' '}
            <span className="tw-text-xs">(certaines peuvent être comptabilisées plusieurs fois)</span>
          </>
        }
      />
    </>
  );
};

export default ObservationsStats;
