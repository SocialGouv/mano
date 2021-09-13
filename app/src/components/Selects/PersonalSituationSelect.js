import React from 'react';
import { personalSituationOptions } from '../../contexts/persons';
import SelectLabelled from './SelectLabelled';

export const situations = ['-- Choisissez --', ...personalSituationOptions];

const PersonalSituationSelect = ({ value = situations[0], onSelect, editable }) => {
  return (
    <SelectLabelled
      label="Situation personnelle"
      values={situations}
      value={value.length ? value : situations[0]}
      onSelect={onSelect}
      editable={editable}
    />
  );
};

export default PersonalSituationSelect;
