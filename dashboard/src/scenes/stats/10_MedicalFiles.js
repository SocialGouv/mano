import React from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';
import CustomFieldsStats from './CustomFieldsStats';
import Filters from '../../components/Filters';
import { AgeRangeBar } from './4_Persons';

const MedicalFilesStats = ({ filterBase, filterPersons, setFilterPersons, personsForStats, customFieldsMedicalFile, personFields }) => {
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des dossiers médicaux</h3>
      <Filters base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      <AgeRangeBar persons={personsForStats} />
      <CustomResponsivePie
        title="Genre"
        field="gender"
        data={getPieData(personsForStats, 'gender', { options: personFields.find((f) => f.name === 'gender').options })}
      />
      <CustomResponsivePie
        title="Couverture médicale des personnes"
        field="healthInsurances"
        data={getPieData(personsForStats, 'healthInsurances', { options: personFields.find((f) => f.name === 'healthInsurances').options })}
      />
      <CustomFieldsStats data={personsForStats} customFields={customFieldsMedicalFile} />
    </>
  );
};

export default MedicalFilesStats;
