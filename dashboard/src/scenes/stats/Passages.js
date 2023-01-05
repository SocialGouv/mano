import React from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';

const PassagesStats = ({ passages, personFields, personsInPassagesOfPeriod, personsInPassagesBeforePeriod }) => {
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des passages</h3>
      <CustomResponsivePie title="Nombre de passages" data={getPieData(passages, 'type', { options: ['Anonyme', 'Non-anonyme'] })} />
      <CustomResponsivePie
        title="Répartition des passages non-anonymes"
        data={getPieData(
          passages.filter((p) => !!p.gender),
          'gender',
          { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
        )}
      />
      <CustomResponsivePie
        title="Nombre de personnes différentes passées (passages anonymes exclus)"
        data={getPieData(personsInPassagesOfPeriod, 'gender', {
          options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'],
        })}
      />
      <CustomResponsivePie
        title="Nombre de nouvelles personnes passées (passages anonymes exclus)"
        data={getPieData(
          personsInPassagesOfPeriod.filter((personId) => !personsInPassagesBeforePeriod.includes(personId)),
          'gender',
          { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
        )}
      />
    </>
  );
};

export default PassagesStats;
