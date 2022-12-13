import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

const GenderSelect = ({ value = genders[0], onSelect, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);
  const genders = ['-- Choisissez un genre --', ...personFields.find((f) => f.name === 'gender').options];
  return <SelectLabelled label="Genre" values={genders} value={value} onSelect={onSelect} editable={editable} />;
};

export default GenderSelect;
