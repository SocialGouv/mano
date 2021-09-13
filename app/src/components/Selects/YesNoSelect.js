import React from 'react';
import SelectLabelled from './SelectLabelled';

// prettier-ignore
export const choices = [
  '-- Choisissez --',
  'Oui',
  'Non',
];

const YesNoSelect = ({ label, value = choices[0], onSelect, editable }) => {
  return (
    <SelectLabelled
      label={label}
      values={choices}
      value={value.length ? value : choices[0]}
      onSelect={onSelect}
      editable={editable}
    />
  );
};

export default YesNoSelect;
