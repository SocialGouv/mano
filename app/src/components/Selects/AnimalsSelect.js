import React from 'react';
import SelectLabelled from './SelectLabelled';

// prettier-ignore
export const situations = [
  '-- Ne sait pas --',
  'Oui',
  'Non',
];

const AnimalsSelect = ({ value = situations[0], onSelect, editable }) => {
  return (
    <SelectLabelled
      label="Avec animaux"
      values={situations}
      value={value.length ? value : situations[0]}
      onSelect={onSelect}
      editable={editable}
    />
  );
};

export default AnimalsSelect;
