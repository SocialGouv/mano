import React from 'react';
import { useRecoilValue } from 'recoil';
import { flattenedCustomFieldsPersonsSelector } from '../../recoil/persons';
import MultiCheckBoxes from '../MultiCheckBoxes/MultiCheckBoxes';

const HealthInsuranceMultiCheckBox = ({ values, onChange, editable }) => {
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);

  return (
    <MultiCheckBoxes
      label="Couverture(s) médicale(s)"
      source={flattenedCustomFieldsPersons.find((f) => f.name === 'healthInsurances').options}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default HealthInsuranceMultiCheckBox;
