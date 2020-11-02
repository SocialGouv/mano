import React from 'react';
import SelectLabelled from '../../components/SelectLabelled';

export const genders = [
  { _id: '0', name: '-- Choisissez un genre --' },
  { _id: '1', name: '-- Aucun --' },
  { _id: '11', name: 'Homme' },
  { _id: '12', name: 'Femme' },
];

const GenderSelect = ({ value, onSelect }) => {
  return (
    <SelectLabelled
      label="Genre"
      values={genders}
      value={genders.find((u) => u.name === value)}
      onSelect={({ name }) => onSelect(name)}
    />
  );
};

export default GenderSelect;
