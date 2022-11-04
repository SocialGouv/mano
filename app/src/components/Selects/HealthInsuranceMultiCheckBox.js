import React from 'react';
import { healthInsuranceOptions } from '../../recoil/persons';
import MultiCheckBoxes from '../MultiCheckBoxes/MultiCheckBoxes';

const HealthInsuranceMultiCheckBox = ({ values, onChange, editable }) => {
  return (
    <MultiCheckBoxes
      label="Couverture(s) médicale(s)"
      source={healthInsuranceOptions}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default HealthInsuranceMultiCheckBox;
