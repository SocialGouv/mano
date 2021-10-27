import React from 'react';
import { outOfActiveListReasonOptions } from '../../contexts/persons';
import SelectLabelled from './SelectLabelled';

export const reasons = ['-- Choisissez une raison  --', ...outOfActiveListReasonOptions];

const OutOfActiveListReasonSelect = ({ value, onSelect, editable }) => {
  if (!value?.length) value = reasons[0];
  return <SelectLabelled label="Motif de sortie de file active" values={reasons} value={value} onSelect={onSelect} editable={editable} />;
};

export default OutOfActiveListReasonSelect;
