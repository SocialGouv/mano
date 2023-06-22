import React, { useMemo } from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';
import Filters from '../../components/Filters';

const RencontresStats = ({
  rencontres,
  personFields,
  personsWithRencontres,
  personsInRencontresBeforePeriod,
  // filter by persons
  filterBase,
  filterPersons,
  setFilterPersons,
}) => {
  const filterTitle = useMemo(() => {
    if (!filterPersons.length) {
      if (personsWithRencontres.length === 1)
        return `Filtrer par personnes suivies (${personsWithRencontres.length} personne concernée sans filtre) :`;
      return `Filtrer par personnes suivies (${personsWithRencontres.length} personnes concernées sans filtre) :`;
    }
    if (personsWithRencontres.length === 1)
      return `Filtrer par personnes suivies (${personsWithRencontres.length} personne concernée par le filtre actuel) :`;
    return `Filtrer par personnes suivies (${personsWithRencontres.length} personnes concernées par le filtre actuel) :`;
  }, [filterPersons, personsWithRencontres.length]);

  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des rencontres</h3>
      <div className="tw-flex tw-basis-full tw-items-center">
        <Filters title={filterTitle} base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      </div>
      <CustomResponsivePie
        title="Nombre de rencontres"
        data={getPieData(rencontres, 'type', { options: ['Anonyme', 'Non-anonyme'] })}
        help={`Nombre de rencontres enregistrées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des rencontres.`}
      />
      <CustomResponsivePie
        title="Répartition des rencontres"
        help={`Répartition par genre des rencontres non-anonymes (c'est-à-dire attachées à une personne) enregistrées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des rencontres.`}
        data={getPieData(
          rencontres.filter((p) => !!p.gender),
          'gender',
          { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
        )}
      />
      <CustomResponsivePie
        title="Nombre de personnes différentes rencontrées"
        help={`Répartition par genre des rencontres non-anonymes (c'est-à-dire attachées à une personne) et uniques enregistrées dans la période définie.\n\nEn d'autres termes, si une personne est rencontrée plusieurs fois, elle n'est comptabilisée ici qu'une seule fois.\n\nSi aucune période n'est définie, on considère l'ensemble des rencontres.`}
        data={getPieData(personsWithRencontres, 'gender', {
          options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'],
        })}
      />
      <CustomResponsivePie
        title="Nombre de nouvelles personnes rencontrées"
        help={`Répartition par genre des rencontres concernant des personnes créées pendant la période définie, enregistrées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des rencontres.`}
        data={getPieData(
          personsWithRencontres.filter((person) => !personsInRencontresBeforePeriod[person._id]),
          'gender',
          { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
        )}
      />
    </>
  );
};

export default RencontresStats;
