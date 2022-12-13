import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

const AnimalsSelect = ({ value, onSelect, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);
  const situations = ['-- Ne sait pas --', ...personFields.find((f) => f.name === 'hasAnimal').options];

  return (
    <SelectLabelled label="Avec animaux" values={situations} value={value.length ? value : situations[0]} onSelect={onSelect} editable={editable} />
  );
};

export default AnimalsSelect;
