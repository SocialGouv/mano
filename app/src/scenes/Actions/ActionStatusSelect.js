import React from 'react';
import SelectLabelled from '../../components/SelectLabelled';

const statuses = [
  { _id: 'A FAIRE', name: 'À FAIRE' },
  { _id: 'FAIT', name: 'FAIT' },
];

const ActionStatusSelect = ({ value, onSelect }) => {
  return (
    <SelectLabelled
      label="Status"
      values={statuses}
      value={statuses.find((u) => u._id === value)}
      onSelect={({ _id }) => onSelect(_id)}
    />
  );
};

export default ActionStatusSelect;
