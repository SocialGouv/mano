import React from 'react';
import { mappedIdsToLabels } from '../recoil/actions';
import SelectCustom from './SelectCustom';

const SelectStatus = ({ onChange, value, name = 'status' }) => {
  return (
    <SelectCustom
      options={mappedIdsToLabels}
      value={value ? { _id: value } : null}
      onChange={(v) => onChange({ target: { value: v?._id, name } })}
      getOptionValue={(i) => i?._id}
      getOptionLabel={(i) => mappedIdsToLabels.find((o) => o._id === i._id)?.name}
    />
  );
};

export default SelectStatus;
