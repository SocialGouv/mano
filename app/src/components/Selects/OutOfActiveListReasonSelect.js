import React from 'react';
import { useRecoilValue } from 'recoil';
import { customFieldsPersonsSocialSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

const OutOfActiveListReasonSelect = ({ value, onSelect, editable }) => {
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const outOfActiveListReasonOptions = customFieldsPersonsSocial.find((f) => f.name === 'outOfActiveListReason').options;
  const reasons = ['-- Choisissez une raison  --', ...outOfActiveListReasonOptions];
  if (!value?.length) value = reasons[0];
  return <SelectLabelled label="Motif de sortie de file active" values={reasons} value={value} onSelect={onSelect} editable={editable} />;
};

export default OutOfActiveListReasonSelect;
