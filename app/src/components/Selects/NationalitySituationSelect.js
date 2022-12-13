import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

const NationalitySituationSelect = ({ value = situations[0], onSelect, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);
  const situations = ['-- Choisissez --', ...personFields.find((f) => f.name === 'nationalitySituation').options];

  return (
    <SelectLabelled label="Nationalité" values={situations} value={value.length ? value : situations[0]} onSelect={onSelect} editable={editable} />
  );
};

export default NationalitySituationSelect;
