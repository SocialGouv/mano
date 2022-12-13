import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import MultiCheckBoxes from '../MultiCheckBoxes/MultiCheckBoxes';

const HealthInsuranceMultiCheckBox = ({ values, onChange, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);

  return (
    <MultiCheckBoxes
      label="Couverture(s) médicale(s)"
      source={personFields.find((f) => f.name === 'healthInsurances').options}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default HealthInsuranceMultiCheckBox;
