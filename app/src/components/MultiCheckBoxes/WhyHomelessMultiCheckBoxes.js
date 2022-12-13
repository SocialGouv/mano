import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import MultiCheckBoxes from './MultiCheckBoxes';

const WhyHomelessMultiCheckBoxes = ({ values = [], onChange, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);
  return (
    <MultiCheckBoxes
      label="Motif de la situation en rue"
      source={personFields.find((f) => f.name === 'reasons').options}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default WhyHomelessMultiCheckBoxes;
