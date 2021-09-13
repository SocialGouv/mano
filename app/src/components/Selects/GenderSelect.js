import React from 'react';
import { genderOptions } from '../../contexts/persons';
import SelectLabelled from './SelectLabelled';

// prettier-ignore
export const genders = [
  '-- Choisissez un genre --',
  ...genderOptions,
];

const GenderSelect = ({ value = genders[0], onSelect, editable }) => {
  return <SelectLabelled label="Genre" values={genders} value={value} onSelect={onSelect} editable={editable} />;
};

export default GenderSelect;
