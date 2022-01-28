import React from 'react';
import SelectLabelled from './SelectLabelled';

// prettier-ignore
export const situations = [
  '-- Choisissez --',
  'Avec',
  'Sans',
];

const DomiciliationSelect = ({ value = situations[0], onSelect, editable }) => {
  return (
    <SelectLabelled label="Hébergement" values={situations} value={value.length ? value : situations[0]} onSelect={onSelect} editable={editable} />
  );
};

export default DomiciliationSelect;
