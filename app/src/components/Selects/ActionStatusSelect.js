import React from 'react';
import { CANCEL, CHOOSE, DONE, mappedIdsToLabels, TODO } from '../../recoil/actions';
import colors from '../../utils/colors';
import SelectLabelled from './SelectLabelled';

// prettier-ignore
const statuses = [
  TODO,
  DONE,
  CANCEL,
];

const ActionStatusSelect = ({ value = CHOOSE, onSelect, onSelectAndSave, editable }) => {
  return (
    <SelectLabelled
      label="Status"
      values={statuses}
      mappedIdsToLabels={mappedIdsToLabels}
      value={value}
      onSelect={onSelect}
      onSelectAndSave={onSelectAndSave}
      editable={editable}
      buttonCaption={value === TODO ? 'FAIT' : null}
      buttonValue={value === TODO ? DONE : null}
      buttonBg={value === TODO ? colors.app.color : null}
      buttonColor="#fff"
    />
  );
};

export default ActionStatusSelect;
