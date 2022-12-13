import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

const PersonalSituationSelect = ({ value = situations[0], onSelect, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);
  const situations = ['-- Choisissez --', ...personFields.find((f) => f.name === 'personalSituation').options];
  return (
    <SelectLabelled
      label="Situation personnelle"
      values={situations}
      value={value.length ? value : situations[0]}
      onSelect={onSelect}
      editable={editable}
    />
  );
};

export default PersonalSituationSelect;
