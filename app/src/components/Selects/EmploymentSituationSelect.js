import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

const EmploymentSituationSelect = ({ value = situations[0], onSelect, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);
  const situations = ['-- Choisissez --', ...personFields.find((f) => f.name === 'employment').options];
  return <SelectLabelled label="Emploi" values={situations} value={value.length ? value : situations[0]} onSelect={onSelect} editable={editable} />;
};

export default EmploymentSituationSelect;
