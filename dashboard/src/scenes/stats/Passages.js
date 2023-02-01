import React from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';
import { AgeRangeBar } from './Persons';

const PassagesStats = ({ passages, personFields, personsInPassagesOfPeriod, personsInPassagesBeforePeriod }) => {
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des passages</h3>
      <CustomResponsivePie
        title="Nombre de passages"
        data={getPieData(passages, 'type', { options: ['Anonyme', 'Non-anonyme'] })}
        help={`Nombre de passages enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des passages.`}
      />
      <CustomResponsivePie
        title="Répartition des passages non-anonymes"
        help={`Répartition par genre des passages non-anonymes (c'est-à-dire attachés à une personne) enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des passages.`}
        data={getPieData(
          passages.filter((p) => !!p.gender),
          'gender',
          { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
        )}
      />
      <CustomResponsivePie
        title="Nombre de personnes différentes passées (passages anonymes exclus)"
        help={`Répartition par genre des passages non-anonymes (c'est-à-dire attachés à une personne) et uniques enregistrés dans la période définie.\n\nEn d'autres termes, si une personne est passée plusieurs fois, elle n'est comptabilisée ici qu'une seule fois.\n\nSi aucune période n'est définie, on considère l'ensemble des passages.`}
        data={getPieData(personsInPassagesOfPeriod, 'gender', {
          options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'],
        })}
      />
      <CustomResponsivePie
        title="Nombre de nouvelles personnes passées (passages anonymes exclus)"
        help={`Répartition par genre des passages concernant des personnes créées pendant la période définie, enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des passages.`}
        data={getPieData(
          personsInPassagesOfPeriod.filter((personId) => !personsInPassagesBeforePeriod.includes(personId)),
          'gender',
          { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
        )}
      />
      <AgeRangeBar persons={ personsInPassagesOfPeriod } />
    </>
  );
};

export default PassagesStats;
