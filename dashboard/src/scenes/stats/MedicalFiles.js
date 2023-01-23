import React from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';
import CustomFieldsStats from './CustomFieldsStats';
import Filters from '../../components/Filters';
import { AgeRangeBar } from './Persons';

const MedicalFilesStats = ({ filterBase, filterPersons, setFilterPersons, personsForStats, customFieldsMedicalFile, personFields, title }) => {
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des dossiers médicaux des {title}</h3>
      <Filters base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      <AgeRangeBar persons={personsForStats} />
      <CustomResponsivePie
        title="Genre"
        field="gender"
        data={getPieData(personsForStats, 'gender', { options: personFields.find((f) => f.name === 'gender').options })}
        help={`Couverture médicale des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomFieldsStats
        data={personsForStats}
        customFields={customFieldsMedicalFile}
        help={(label) =>
          `${label.capitalize()} des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`
        }
      />
    </>
  );
};

export default MedicalFilesStats;
