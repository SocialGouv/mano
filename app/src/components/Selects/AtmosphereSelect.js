import React from 'react';
import SelectLabelled from './SelectLabelled';

// prettier-ignore
export const atmospheres = [
  '-- Choisissez --',
  'Violences',
  'Tensions',
  'RAS',
];

const AtmosphereSelect = ({ value = atmospheres[0], onSelect, editable }) => {
  return (
    <SelectLabelled label="Ambiance" values={atmospheres} value={value.length ? value : atmospheres[0]} onSelect={onSelect} editable={editable} />
  );
};

export default AtmosphereSelect;
