import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import MultiCheckBoxes from './MultiCheckBoxes';

const RessourcesMultiCheckBoxes = ({ values = [], onChange, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);
  return (
    <MultiCheckBoxes
      label="Ressources"
      source={personFields.find((f) => f.name === 'resources').options}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default RessourcesMultiCheckBoxes;
