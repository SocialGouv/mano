import React from 'react';
import { consumptionsOptions } from '../../contexts/persons';
import MultiCheckBoxes from './MultiCheckBoxes';

const ConsumptionsMultiCheckBoxes = ({ values = [], onChange, editable }) => {
  return (
    <MultiCheckBoxes
      label="Consommations"
      source={consumptionsOptions}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default ConsumptionsMultiCheckBoxes;
