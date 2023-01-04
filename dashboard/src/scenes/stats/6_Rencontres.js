import React from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';

const RencontresStats = ({ rencontres, personFields, personsInRencontresOfPeriod, personsInRencontresBeforePeriod }) => {
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des rencontres</h3>
      <CustomResponsivePie title="Nombre de rencontres" data={getPieData(rencontres, 'type', { options: ['Anonyme', 'Non-anonyme'] })} />
      <CustomResponsivePie
        title="Répartition des rencontres"
        data={getPieData(
          rencontres.filter((p) => !!p.gender),
          'gender',
          { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
        )}
      />
      <CustomResponsivePie
        title="Nombre de personnes différentes rencontrées"
        data={getPieData(personsInRencontresOfPeriod, 'gender', {
          options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'],
        })}
      />
      <CustomResponsivePie
        title="Nombre de nouvelles personnes rencontrées"
        data={getPieData(
          personsInRencontresOfPeriod.filter((personId) => !personsInRencontresBeforePeriod.includes(personId)),
          'gender',
          { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
        )}
      />
    </>
  );
};

export default RencontresStats;
