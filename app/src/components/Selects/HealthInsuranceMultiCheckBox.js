import React from 'react';
import { useRecoilValue } from 'recoil';
import { customFieldsPersonsMedicalSelector, personFieldsSelector } from '../../recoil/persons';
import MultiCheckBoxes from '../MultiCheckBoxes/MultiCheckBoxes';

const HealthInsuranceMultiCheckBox = ({ values, onChange, editable }) => {
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);

  return (
    <MultiCheckBoxes
      label="Couverture(s) médicale(s)"
      source={customFieldsPersonsMedical.find((f) => f.name === 'healthInsurances').options}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default HealthInsuranceMultiCheckBox;
