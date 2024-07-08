import { useMemo } from "react";
import { CustomResponsivePie } from "./Charts";
import { getPieData } from "./utils";
import { AgeRangeBar } from "./PersonsStats";
import Filters from "../../components/Filters";

const PassagesStats = ({
  passages,
  personFields,
  personsWithPassages,
  personsInPassagesBeforePeriod,
  filterBase,
  filterPersons,
  setFilterPersons,
}) => {
  const filterTitle = useMemo(() => {
    if (!filterPersons.length) return `Filtrer par personnes suivies :`;
    if (personsWithPassages.length === 1)
      return `Filtrer par personnes suivies (${personsWithPassages.length} personne concernée par le filtre actuel) :`;
    return `Filtrer par personnes suivies (${personsWithPassages.length} personnes concernées par le filtre actuel) :`;
  }, [filterPersons, personsWithPassages]);

  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des passages</h3>
      <div className="tw-flex tw-basis-full tw-items-center">
        <Filters title={filterTitle} base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      </div>
      <CustomResponsivePie
        title="Nombre de passages"
        data={getPieData(passages, "type", { options: ["Anonyme", "Non-anonyme"] })}
        help={`Nombre de passages enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des passages.`}
      />
      <CustomResponsivePie
        title="Répartition des passages non-anonymes"
        help={`Répartition par genre des passages non-anonymes (c'est-à-dire attachés à une personne) enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des passages.`}
        data={getPieData(
          passages.filter((p) => !!p.gender),
          "gender",
          { options: [...personFields.find((f) => f.name === "gender").options, "Non précisé"] }
        )}
      />
      <CustomResponsivePie
        title="Nombre de personnes différentes passées (passages anonymes exclus)"
        help={`Répartition par genre des passages non-anonymes (c'est-à-dire attachés à une personne) et uniques enregistrés dans la période définie.\n\nEn d'autres termes, si une personne est passée plusieurs fois, elle n'est comptabilisée ici qu'une seule fois.\n\nSi aucune période n'est définie, on considère l'ensemble des passages.`}
        data={getPieData(personsWithPassages, "gender", {
          options: [...personFields.find((f) => f.name === "gender").options, "Non précisé"],
        })}
      />
      <CustomResponsivePie
        title="Nombre de nouvelles personnes passées (passages anonymes exclus)"
        help={`Répartition par genre des passages concernant des personnes créées pendant la période définie, enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des passages.`}
        data={getPieData(
          personsWithPassages.filter((person) => !personsInPassagesBeforePeriod[person._id]),
          "gender",
          { options: [...personFields.find((f) => f.name === "gender").options, "Non précisé"] }
        )}
      />
      <AgeRangeBar persons={personsWithPassages} />
    </>
  );
};

export default PassagesStats;
