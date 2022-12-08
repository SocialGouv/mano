import React from 'react';
import SelectCustom from './SelectCustom';

const SelectAsInput = ({ options, name, onChange, value, ...props }) => {
  return (
    <SelectCustom
      getOptionValue={(i) => i.value}
      getOptionLabel={(i) => i.label}
      {...props}
      options={options.map((o) => ({ value: o, label: o }))}
      name={name}
      value={[{ value, label: value }]}
      isClearable={!!value}
      onChange={(option) => onChange({ currentTarget: { value: option?.value, name } })}
    />
  );
};

export default SelectAsInput;
