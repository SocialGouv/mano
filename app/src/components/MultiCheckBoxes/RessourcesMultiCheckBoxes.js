import React from 'react';
import { ressourcesOptions } from '../../recoil/persons';
import MultiCheckBoxes from './MultiCheckBoxes';

const RessourcesMultiCheckBoxes = ({ values = [], onChange, editable }) => {
  return (
    <MultiCheckBoxes
      label="Ressources"
      source={ressourcesOptions}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default RessourcesMultiCheckBoxes;
