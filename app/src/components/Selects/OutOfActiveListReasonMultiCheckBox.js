import React from 'react';
import { useRecoilValue } from 'recoil';
import { flattenedPersonFieldsSelector } from '../../recoil/persons';
import MultiCheckBoxes from '../MultiCheckBoxes/MultiCheckBoxes';

const OutOfActiveListReasonMultiCheckBox = ({ values, onChange, editable }) => {
  const flattenedPersonFields = useRecoilValue(flattenedPersonFieldsSelector);
  const outOfActiveListReasonOptions = flattenedPersonFields.find((f) => f.name === 'outOfActiveListReasons').options;
  return (
    <MultiCheckBoxes
      label="Motif de sortie de file active"
      source={outOfActiveListReasonOptions}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default OutOfActiveListReasonMultiCheckBox;
