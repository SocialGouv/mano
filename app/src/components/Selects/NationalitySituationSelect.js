import React from 'react';
import { nationalitySituationOptions } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

export const situations = ['-- Choisissez --', ...nationalitySituationOptions];

const NationalitySituationSelect = ({ value = situations[0], onSelect, editable }) => {
  return (
    <SelectLabelled label="Nationalité" values={situations} value={value.length ? value : situations[0]} onSelect={onSelect} editable={editable} />
  );
};

export default NationalitySituationSelect;
