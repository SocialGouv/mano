import React from 'react';
import SelectCustom from './SelectCustom';

const roles = [
  { value: 'normal', label: 'Normal' },
  { value: 'admin', label: 'Admin' },
  { value: 'restricted-access', label: 'Accès restreint' },
];

const SelectRole = ({ value, handleChange }) => (
  <SelectCustom
    options={roles}
    onChange={({ value }) => handleChange({ target: { value, name: 'role' } })}
    value={roles.find((r) => r.value === value)}
    inputId="role"
  />
);

export default SelectRole;
