import React from 'react';
import { useRecoilValue } from 'recoil';
import { flattenedPersonFieldsSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

const GenderSelect = ({ value = genders[0], onSelect, editable }) => {
  const flattenedPersonFields = useRecoilValue(flattenedPersonFieldsSelector);
  const genders = ['-- Choisissez un genre --', ...flattenedPersonFields.find((f) => f.name === 'gender').options];
  return <SelectLabelled label="Genre" values={genders} value={value} onSelect={onSelect} editable={editable} />;
};

export default GenderSelect;
