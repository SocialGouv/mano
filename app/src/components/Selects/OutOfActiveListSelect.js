import React from 'react';
import { yesNoOptions } from '../../contexts/persons';
import SelectLabelled from './SelectLabelled';

export const options = ['-- Tous  --', ...yesNoOptions];

const OutOfActiveListSelect = ({ value = '', onSelect, editable }) => {
  return <SelectLabelled label="Sortie de file active" values={options} value={value} onSelect={onSelect} editable={editable} />;
};

export default OutOfActiveListSelect;
