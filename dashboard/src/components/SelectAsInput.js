import React from 'react';
import SelectCustom from './SelectCustom';

const SelectAsInput = ({ options, name, onChange, value, ...props }) => {
  return (
    <SelectCustom
      placeholder={' -- Choisir -- '}
      getOptionValue={(i) => i}
      getOptionLabel={(i) => i}
      {...props}
      options={options}
      name={name}
      value={[value]}
      isClearable={!!value}
      onChange={(value) => onChange({ currentTarget: { value, name } })}
    />
  );
};

export default SelectAsInput;
