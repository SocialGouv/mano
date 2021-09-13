import React from 'react';
import { reasonsOptions } from '../../contexts/persons';
import MultiCheckBoxes from './MultiCheckBoxes';

const WhyHomelessMultiCheckBoxes = ({ values = [], onChange, editable }) => {
  return (
    <MultiCheckBoxes
      label="Motif de la situation en rue"
      source={reasonsOptions}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default WhyHomelessMultiCheckBoxes;
