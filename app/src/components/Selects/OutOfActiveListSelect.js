import React from 'react';
import { useRecoilValue } from 'recoil';
import { flattenedPersonFieldsSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

const OutOfActiveListSelect = ({ value = '', onSelect, editable }) => {
  const flattenedPersonFields = useRecoilValue(flattenedPersonFieldsSelector);
  const options = ['', ...flattenedPersonFields.find((f) => f.name === 'outOfActiveList').options];
  return <SelectLabelled label="Sortie de file active" values={options} value={value} onSelect={onSelect} editable={editable} />;
};

export default OutOfActiveListSelect;
