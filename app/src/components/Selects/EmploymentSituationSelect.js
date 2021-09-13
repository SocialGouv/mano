import React from 'react';
import { employmentOptions } from '../../contexts/persons';
import SelectLabelled from './SelectLabelled';

export const situations = ['-- Choisissez --', ...employmentOptions];

const EmploymentSituationSelect = ({ value = situations[0], onSelect, editable }) => {
  return <SelectLabelled label="Emploi" values={situations} value={value.length ? value : situations[0]} onSelect={onSelect} editable={editable} />;
};

export default EmploymentSituationSelect;
