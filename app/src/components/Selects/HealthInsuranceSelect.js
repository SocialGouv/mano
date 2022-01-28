import React from 'react';
import { healthInsuranceOptions } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

// prettier-ignore
export const healthInsurances = [
  '-- Choisissez --',
  ...healthInsuranceOptions,
];

const HealthInsuranceSelect = ({ value = healthInsurances[0], onSelect, editable }) => {
  return (
    <SelectLabelled
      label="Couverture médicale"
      values={healthInsurances}
      value={value.length ? value : healthInsurances[0]}
      onSelect={onSelect}
      editable={editable}
    />
  );
};

export default HealthInsuranceSelect;
