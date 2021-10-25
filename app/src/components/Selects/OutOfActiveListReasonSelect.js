import React from 'react';
import { outOfActiveListReasonOptions } from '../../contexts/persons';
import SelectLabelled from './SelectLabelled';

export const reasons = ['-- Choisissez une raison  --', ...outOfActiveListReasonOptions];

const OutOfActiveListReasonSelect = ({ value = reasons[0], onSelect, editable }) => {
  return <SelectLabelled label="Motif de sortie de file active" values={reasons} value={value} onSelect={onSelect} editable={editable} />;
};

export default OutOfActiveListReasonSelect;
